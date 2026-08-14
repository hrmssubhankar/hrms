# ── Stage 1: Build ────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy .csproj files first for layer caching
COPY api/YahwehHrms.Core/YahwehHrms.Core.csproj                   YahwehHrms.Core/
COPY api/YahwehHrms.Infrastructure/YahwehHrms.Infrastructure.csproj YahwehHrms.Infrastructure/
COPY api/YahwehHrms.API/YahwehHrms.API.csproj                      YahwehHrms.API/

# Restore NuGet packages (cached unless .csproj changes)
RUN dotnet restore YahwehHrms.API/YahwehHrms.API.csproj

# Copy all API source code
COPY api/ .

# Publish release build (restore included to avoid stale cache issues)
RUN dotnet publish YahwehHrms.API/YahwehHrms.API.csproj \
    -c Release \
    -o /app/publish

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build --chown=appuser:appgroup /app/publish .

# Railway uses PORT env var; ASP.NET Core reads ASPNETCORE_URLS
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "YahwehHrms.API.dll"]
