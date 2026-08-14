using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using YahwehHrms.Core.Entities;

namespace YahwehHrms.Infrastructure.Services;

public interface IJwtService
{
    string GenerateTenantUserToken(User user);
    string GenerateSuperAdminToken(SuperAdminUser admin);
}

public interface IRefreshTokenService
{
    string GenerateRefreshToken(Guid userId);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateTenantUserToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role ?? string.Empty),
            new Claim("tenant_id", user.TenantId.ToString()),
            new Claim("type", "user")
        };
        return BuildToken(claims);
    }

    public string GenerateSuperAdminToken(SuperAdminUser admin)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, admin.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, admin.Email ?? string.Empty),
            new Claim(ClaimTypes.Role, "SuperAdmin"),
            new Claim("type", "superadmin")
        };
        return BuildToken(claims);
    }

    private string BuildToken(IEnumerable<Claim> claims)
    {
        var secret = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var expiresInHours = int.TryParse(_config["Jwt:ExpiresInHours"], out var h) ? h : 8;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiresInHours),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class RefreshTokenService : IRefreshTokenService
{
    public string GenerateRefreshToken(Guid userId) => string.Empty;
}
