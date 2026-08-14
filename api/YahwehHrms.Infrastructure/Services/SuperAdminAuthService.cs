using Microsoft.EntityFrameworkCore;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public interface ISuperAdminAuthService
{
    Task<string?> AuthenticateAsync(string email, string password, CancellationToken ct = default);
    Task SeedDefaultAdminIfNoneExistsAsync(CancellationToken ct = default);
}

public class SuperAdminAuthService : ISuperAdminAuthService
{
    private readonly HrmsDbContext _db;
    private readonly IJwtService _jwt;

    public SuperAdminAuthService(HrmsDbContext db, IJwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<string?> AuthenticateAsync(string email, string password, CancellationToken ct = default)
    {
        var normalised = email.Trim().ToLowerInvariant();
        var admin = await _db.SuperAdminUsers
            .FirstOrDefaultAsync(a => a.Email == normalised && a.IsActive, ct);
        if (admin is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, admin.PasswordHash)) return null;
        admin.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return _jwt.GenerateSuperAdminToken(admin);
    }

    public async Task SeedDefaultAdminIfNoneExistsAsync(CancellationToken ct = default)
    {
        if (await _db.SuperAdminUsers.AnyAsync(ct)) return;
        _db.SuperAdminUsers.Add(new SuperAdminUser
        {
            Id          = Guid.NewGuid(),
            Email       = "admin@yahwehhrms.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
            DisplayName = "System Administrator",
            IsActive    = true,
            CreatedAt   = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
    }
}
