# ---------------- BUILD ----------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution files
COPY backend/Directory.Build.props ./
COPY backend/Directory.Packages.props ./
COPY backend/global.json ./

# Copy project files
COPY backend/src/LMS.Domain/LMS.Domain.csproj src/LMS.Domain/
COPY backend/src/LMS.Application/LMS.Application.csproj src/LMS.Application/
COPY backend/src/LMS.Infrastructure/LMS.Infrastructure.csproj src/LMS.Infrastructure/
COPY backend/src/LMS.Api/LMS.Api.csproj src/LMS.Api/

# Restore
RUN dotnet restore src/LMS.Api/LMS.Api.csproj

# Copy remaining source
COPY backend/ .

# Publish
RUN dotnet publish src/LMS.Api/LMS.Api.csproj -c Release -o /app/publish --no-restore

# ---------------- RUNTIME ----------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0

WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet","LMS.Api.dll"]