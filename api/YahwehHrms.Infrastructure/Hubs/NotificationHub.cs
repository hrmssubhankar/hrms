using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace YahwehHrms.Infrastructure.Hubs;

/// <summary>
/// Real-time notification hub — replaces Azure SignalR Service.
/// Self-hosted WebSocket hub — free for &lt;500 concurrent users.
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.User?.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
        }
        await base.OnConnectedAsync();
    }

    public async Task SendToTenant(string tenantId, string message)
    {
        await Clients.Group($"tenant_{tenantId}").SendAsync("ReceiveNotification", message);
    }

    public async Task SendToUser(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }
}
