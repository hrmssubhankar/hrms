using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using YahwehHrms.Infrastructure.Services;

namespace YahwehHrms.API.Controllers.SuperAdmin;

[ApiController]
[Route("api/superadmin/auth")]
public class SuperAdminAuthController : ControllerBase
{
    private readonly ISuperAdminAuthService _authService;

    public SuperAdminAuthController(ISuperAdminAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] SuperAdminLoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });
        var token = await _authService.AuthenticateAsync(request.Email, request.Password, ct);
        if (token is null) return Unauthorized(new { error = "Invalid credentials." });
        return Ok(new { token });
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        var role = User.FindFirstValue(ClaimTypes.Role);
        return Ok(new { id = sub, email, role, type = "superadmin" });
    }
}

public record SuperAdminLoginRequest(string Email, string Password);
