using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace Api.Tests.Integration;

public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"urlshortener-tests-{Guid.NewGuid():N}.db");

    public TestWebApplicationFactory()
    {
        AppDomain.CurrentDomain.ProcessExit += OnProcessExit;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", $"Data Source={_databasePath}");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools();
        TryDeleteDatabase();
        AppDomain.CurrentDomain.ProcessExit -= OnProcessExit;
    }

    private void OnProcessExit(object? sender, EventArgs e) => TryDeleteDatabase();

    private void TryDeleteDatabase()
    {
        for (var attempt = 1; attempt <= 10; attempt++)
        {
            try
            {
                if (File.Exists(_databasePath))
                {
                    File.Delete(_databasePath);
                }

                return;
            }
            catch (IOException) when (attempt < 10)
            {
                Thread.Sleep(200);
            }
            catch (UnauthorizedAccessException) when (attempt < 10)
            {
                Thread.Sleep(200);
            }
            catch
            {
                return;
            }
        }
    }
}
