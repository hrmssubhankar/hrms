using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── PostgreSQL via EF Core ───────────────────────────────────────────
        services.AddDbContext<HrmsDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql
                    .MigrationsAssembly("YahwehHrms.Infrastructure")
                    .EnableRetryOnFailure(3)));

        // ── Health checks ────────────────────────────────────────────────────
        services.AddHealthChecks()
            .AddNpgSql(configuration.GetConnectionString("DefaultConnection")!);

        // ── Redis (Upstash) — optional ───────────────────────────────────────
        // Set ConnectionStrings:Redis in Railway/Azure dashboard env vars.
        // API starts fine without Redis (cache falls back to no-op).
        var redisConn = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            var redisOptions = ConfigurationOptions.Parse(redisConn);
            redisOptions.AbortOnConnectFail = false;   // don't crash if Redis is briefly unavailable
            redisOptions.ConnectTimeout     = 5000;
            redisOptions.SyncTimeout        = 5000;
            services.AddSingleton<IConnectionMultiplexer>(
                ConnectionMultiplexer.Connect(redisOptions));
        }

        // ── Repositories & Services ──────────────────────────────────────────
        // Register as they are built:
        // services.AddScoped<IEmployeeRepository, EmployeeRepository>();

        return services;
    }
}
