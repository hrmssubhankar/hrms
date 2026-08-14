using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;
using YahwehHrms.Infrastructure.Services;

namespace YahwehHrms.Infrastructure;

public static class InfrastructureExtensions
{
    /// <summary>
    /// Registers all Infrastructure-layer services: EF Core (Npgsql), caching,
    /// domain services, and health checks.
    ///
    /// Required configuration keys:
    ///   ConnectionStrings:DefaultConnection   — PostgreSQL connection string
    ///
    /// Optional configuration keys:
    ///   Redis:ConnectionString                — if present, distributed cache is added
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration config)
    {
        // ── Database ──────────────────────────────────────────────────────────
        var connStr = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is required. " +
                "Set it in appsettings.json or as an environment variable.");

        services.AddDbContext<HrmsDbContext>(opts =>
            opts.UseNpgsql(connStr, npgsql =>
            {
                npgsql.MigrationsHistoryTable("__ef_migrations_history", "public");
                npgsql.EnableRetryOnFailure(maxRetryCount: 3);
            }));

        // ── Caching ───────────────────────────────────────────────────────────
        // IMemoryCache is used by ModuleService for per-tenant enabled module keys.
        // If you add a Redis connection string, IDistributedCache is also registered.
        services.AddMemoryCache();

        var redisConn = config["Redis:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(redisConn))
            services.AddStackExchangeRedisCache(opts => opts.Configuration = redisConn);

        // ── Domain services ───────────────────────────────────────────────────
        services.AddScoped<IModuleService, ModuleService>();
        services.AddScoped<ITenantService, TenantService>();

        // ── Health checks ─────────────────────────────────────────────────────
        var hc = services.AddHealthChecks()
            .AddNpgSql(connStr, name: "postgres", tags: ["db", "ready"]);

        if (!string.IsNullOrWhiteSpace(redisConn))
            hc.AddRedis(redisConn, name: "redis", tags: ["cache", "ready"]);

        return services;
    }
}
