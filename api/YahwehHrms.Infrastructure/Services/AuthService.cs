using Microsoft.EntityFrameworkCore;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public interface IAuthService
{
    Task<string?> AuthenticateAsync(string email, string password, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly HrmsDbContext _db;
    private readonly IJwtService _jwt;

    public AuthService(HrmsDbContext db, IJwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<string?> AuthenticateAsync(string email, string password, CancellationToken ct = default)
    {
        var normalised = email.Trim().ToLowerInvariant();
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == normalised && u.IsActive, ct);
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;
        user.LastLogin = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return _jwt.GenerateTenantUserToken(user);
    }
}
