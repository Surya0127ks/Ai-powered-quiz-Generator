# --- Build Stage ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY Directory.Build.props Directory.Packages.props ./
COPY src/LMS.Domain/LMS.Domain.csproj src/LMS.Domain/
COPY src/LMS.Application/LMS.Application.csproj src/LMS.Application/
COPY src/LMS.Infrastructure/LMS.Infrastructure.csproj src/LMS.Infrastructure/
COPY src/LMS.Api/LMS.Api.csproj src/LMS.Api/

# Restore packages
RUN dotnet restore src/LMS.Api/LMS.Api.csproj

# Copy all source code
COPY . .

# Build and publish
RUN dotnet publish src/LMS.Api/LMS.Api.csproj -c Release -o /app/publish --no-restore

# --- Runtime Stage ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

COPY --from=build /app/publish .

ENTRYPOINT ["sh", "-c", "dotnet LMS.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]