using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ExperienceController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public ExperienceController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("surveys")]
    public async Task<IActionResult> GetSurveys(CancellationToken ct = default) =>
        Ok(await _db.Surveys.AsNoTracking().Where(s => s.TenantId == TenantId).OrderByDescending(s => s.CreatedAt).ToListAsync(ct));

    [HttpGet("surveys/{id:guid}")]
    public async Task<IActionResult> GetSurvey(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Surveys.AsNoTracking().Include(s => s.SurveyResponses).FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("surveys")]
    public async Task<IActionResult> CreateSurvey([FromBody] Survey survey, CancellationToken ct = default)
    {
        survey.Id = Guid.NewGuid(); survey.TenantId = TenantId; survey.CreatedAt = DateTime.UtcNow;
        _db.Surveys.Add(survey); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetSurvey), new { id = survey.Id }, survey);
    }

    [HttpPut("surveys/{id:guid}")]
    public async Task<IActionResult> UpdateSurvey(Guid id, [FromBody] Survey update, CancellationToken ct = default)
    {
        var item = await _db.Surveys.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        item.Title = update.Title; item.Description = update.Description; item.Status = update.Status; item.CloseDate = update.CloseDate;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("surveys/{id:guid}")]
    public async Task<IActionResult> DeleteSurvey(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Surveys.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = "closed"; await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("surveys/{id:guid}/responses")]
    public async Task<IActionResult> GetSurveyResponses(Guid id, CancellationToken ct = default)
    {
        if (!await _db.Surveys.AsNoTracking().AnyAsync(s => s.TenantId == TenantId && s.Id == id, ct)) return NotFound();
        return Ok(await _db.SurveyResponses.AsNoTracking().Where(r => r.TenantId == TenantId && r.SurveyId == id).Include(r => r.Employee).ToListAsync(ct));
    }

    [HttpPost("surveys/{id:guid}/responses")]
    public async Task<IActionResult> SubmitResponse(Guid id, [FromBody] SurveyResponse response, CancellationToken ct = default)
    {
        if (!await _db.Surveys.AsNoTracking().AnyAsync(s => s.TenantId == TenantId && s.Id == id, ct)) return NotFound();
        response.Id = Guid.NewGuid(); response.TenantId = TenantId; response.SurveyId = id; response.SubmittedAt = DateTime.UtcNow;
        _db.SurveyResponses.Add(response); await _db.SaveChangesAsync(ct);
        return Ok(response);
    }

    [HttpGet("recognitions")]
    public async Task<IActionResult> GetRecognitions(CancellationToken ct = default) =>
        Ok(await _db.Recognitions.AsNoTracking().Where(r => r.TenantId == TenantId).Include(r => r.Employee).OrderByDescending(r => r.RecognisedAt).ToListAsync(ct));

    [HttpGet("recognitions/{id:guid}")]
    public async Task<IActionResult> GetRecognition(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Recognitions.AsNoTracking().Include(r => r.Employee).FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("recognitions")]
    public async Task<IActionResult> CreateRecognition([FromBody] Recognition recognition, CancellationToken ct = default)
    {
        recognition.Id = Guid.NewGuid(); recognition.TenantId = TenantId; recognition.RecognisedAt = DateTime.UtcNow;
        _db.Recognitions.Add(recognition); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetRecognition), new { id = recognition.Id }, recognition);
    }

    [HttpDelete("recognitions/{id:guid}")]
    public async Task<IActionResult> DeleteRecognition(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Recognitions.FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        if (item is null) return NotFound();
        _db.Recognitions.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("referrals")]
    public async Task<IActionResult> GetReferrals(CancellationToken ct = default) =>
        Ok(await _db.Referrals.AsNoTracking().Where(r => r.TenantId == TenantId).Include(r => r.Employee).OrderByDescending(r => r.ReferredAt).ToListAsync(ct));

    [HttpPost("referrals")]
    public async Task<IActionResult> CreateReferral([FromBody] Referral referral, CancellationToken ct = default)
    {
        referral.Id = Guid.NewGuid(); referral.TenantId = TenantId; referral.ReferredAt = DateTime.UtcNow;
        _db.Referrals.Add(referral); await _db.SaveChangesAsync(ct);
        return Ok(referral);
    }

    [HttpPut("referrals/{id:guid}")]
    public async Task<IActionResult> UpdateReferral(Guid id, [FromBody] Referral update, CancellationToken ct = default)
    {
        var item = await _db.Referrals.FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = update.Status; item.Notes = update.Notes;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] bool? unreadOnly, CancellationToken ct = default)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();
        var q = _db.Notifications.AsNoTracking().Where(n => n.TenantId == TenantId && n.UserId == userId).AsQueryable();
        if (unreadOnly == true) q = q.Where(n => !n.IsRead);
        return Ok(await q.OrderByDescending(n => n.CreatedAt).Take(100).ToListAsync(ct));
    }

    [HttpPut("notifications/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct = default)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();
        var item = await _db.Notifications.FirstOrDefaultAsync(n => n.TenantId == TenantId && n.Id == id && n.UserId == userId, ct);
        if (item is null) return NotFound();
        item.IsRead = true; item.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpPut("notifications/read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct = default)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();
        var unread = await _db.Notifications.Where(n => n.TenantId == TenantId && n.UserId == userId && !n.IsRead).ToListAsync(ct);
        foreach (var n in unread) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync(ct);
        return Ok(new { updated = unread.Count });
    }
}
