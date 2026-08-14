using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;
using YahwehHrms.Infrastructure.Services;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly HrmsDbContext _db;
    private readonly IAuthService _authService;

    public AuthController(HrmsDbContext db, IAuthService authService)
    {
        _db = db;
        _authService = authService;
    }

    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });
        var token = await _authService.AuthenticateAsync(request.Email, request.Password, ct);
        if (token is null)
            return Unauthorized(new { error = "Invalid email or password." });
        return Ok(new { token });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct = default)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId))
            return Unauthorized(new { error = "Invalid token subject." });
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.TenantId == TenantId)
            .Include(u => u.Employee)
            .Select(u => new
            {
                u.Id, u.TenantId, u.Email, u.Role, u.IsActive, u.CreatedAt,
                Employee = u.Employee == null ? null : new
                {
                    u.Employee.Id,
                    u.Employee.FirstName,
                    u.Employee.LastName,
                    u.Employee.DepartmentId,
                    u.Employee.PositionId,
                    Status = u.Employee.Status,
                    StartDate = u.Employee.StartDate
                }
            })
            .FirstOrDefaultAsync(ct);
        if (user is null) return NotFound(new { error = "User not found." });
        return Ok(user);
    }

    [Authorize(Roles = "admin")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });
        var tenantId = TenantId;
        var exists = await _db.Users.AsNoTracking()
            .AnyAsync(u => u.Email == request.Email.ToLowerInvariant() && u.TenantId == tenantId, ct);
        if (exists) return Conflict(new { error = "A user with that email already exists." });
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "employee" : request.Role.Trim().ToLower(),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Me), new { }, new { user.Id, user.TenantId, user.Email, user.Role });
    }
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string? Role);
