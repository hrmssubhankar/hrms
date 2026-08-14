using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;
using YahwehHrms.Core.Interfaces;

namespace YahwehHrms.Infrastructure.Middleware;

// ── Attribute ─────────────────────────────────────────────────────────────────

/// <summary>
/// Decorate a controller or action with [RequireModule("module_key")]
/// to block access if the tenant does not have that module enabled.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class RequireModuleAttribute : Attribute
{
    public string ModuleKey { get; }
    public RequireModuleAttribute(string moduleKey) => ModuleKey = moduleKey;
}

// ── Middleware ────────────────────────────────────────────────────────────────

/// <summary>
/// Reads [RequireModule] from the matched endpoint metadata and short-circuits
/// with 403 if the current tenant does not have that module active.
///
/// Registration order (in Program.cs):
///   app.UseAuthentication();
///   app.UseAuthorization();
///   app.UseMiddleware&lt;ModuleGuardMiddleware&gt;();
///   app.MapControllers();
/// </summary>
public sealed class ModuleGuardMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ModuleGuardMiddleware> _log;

    public ModuleGuardMiddleware(RequestDelegate next, ILogger<ModuleGuardMiddleware> log)
    {
        _next = next;
        _log  = log;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        var endpoint = ctx.GetEndpoint();
        if (endpoint is null)
        {
            await _next(ctx);
            return;
        }

        // Collect all [RequireModule] attributes on this endpoint
        var required = endpoint.Metadata
            .OfType<RequireModuleAttribute>()
            .Select(a => a.ModuleKey)
            .ToList();

        if (required.Count == 0)
        {
            await _next(ctx);
            return;
        }

        // Resolve tenantId from the JWT claim (claim name: "tenant_id")
        var tenantClaim = ctx.User.FindFirst("tenant_id")?.Value;
        if (!Guid.TryParse(tenantClaim, out var tenantId))
        {
            // No authenticated tenant — let the auth middleware handle it
            await _next(ctx);
            return;
        }

        var modules = ctx.RequestServices.GetRequiredService<IModuleService>();

        foreach (var key in required)
        {
            var enabled = await modules.IsModuleEnabledAsync(tenantId, key, ctx.RequestAborted);
            if (!enabled)
            {
                _log.LogWarning(
                    "Module '{ModuleKey}' is not enabled for tenant {TenantId} — request blocked",
                    key, tenantId);

                ctx.Response.StatusCode  = (int)HttpStatusCode.Forbidden;
                ctx.Response.ContentType = "application/json";

                var body = JsonSerializer.Serialize(new ProblemDetails
                {
                    Status = 403,
                    Title  = "Module not enabled",
                    Detail = $"The '{key}' module is not active for your organisation. " +
                             "Contact your administrator to enable it."
                });

                await ctx.Response.WriteAsync(body, ctx.RequestAborted);
                return;
            }
        }

        await _next(ctx);
    }
}
