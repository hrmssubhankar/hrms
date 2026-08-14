using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;
using YahwehHrms.Infrastructure.Services;

namespace YahwehHrms.Infrastructure;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration config)
    {
        // ── Database ──────────────────────────────────────────────────────────
        var connStr = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is required.");

        services.AddDbContext<HrmsDbContext>(opts =>
            opts.UseNpgsql(connStr, npgsql =>
            {
                npgsql.MigrationsAssembly("YahwehHrms.Infrastructure");
                npgsql.EnableRetryOnFailure(maxRetryCount: 3);
            }));

        // ── Caching ───────────────────────────────────────────────────────────
        services.AddMemoryCache();

        // ── Redis (optional) ──────────────────────────────────────────────────
        var redisConn = config.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            var redisOptions = ConfigurationOptions.Parse(redisConn);
            redisOptions.AbortOnConnectFail = false;
            redisOptions.ConnectTimeout     = 5000;
            redisOptions.SyncTimeout        = 5000;
            services.AddSingleton<IConnectionMultiplexer>(
                ConnectionMultiplexer.Connect(redisOptions));
        }

        // ── Auth & JWT services ───────────────────────────────────────────────
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ISuperAdminAuthService, SuperAdminAuthService>();

        // ── Domain services ───────────────────────────────────────────────────
        services.AddScoped<IModuleService, ModuleService>();
        services.AddScoped<ITenantService, TenantService>();

        // ── Health checks ─────────────────────────────────────────────────────
        var hc = services.AddHealthChecks()
            .AddNpgSql(connStr, name: "postgres", tags: new[] { "db", "ready" });

        if (!string.IsNullOrWhiteSpace(redisConn))
            hc.AddRedis(redisConn, name: "redis", tags: new[] { "cache", "ready" });

        return services;
    }
}
