using Api.Models;
using Dapper;
using Microsoft.Data.Sqlite;

namespace Api.Data;

public class UrlRepository(string connectionString) : IUrlRepository
{
    private SqliteConnection Connect() => new(connectionString);

    public async Task<bool> AddAsync(ShortenedUrl url)
    {
        using var conn = Connect();

        try
        {
            await conn.ExecuteAsync(
                "INSERT INTO urls (alias, full_url) VALUES (@Alias, @FullUrl)",
                url);
            return true;
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19) // SQLITE_CONSTRAINT — alias primary key already exists
        {
            return false;
        }
    }

    public async Task<bool> AliasExistsAsync(string alias)
    {
        using var conn = Connect();
        var count = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM urls WHERE alias = @alias",
            new { alias });

        return count > 0;
    }

    public async Task<bool> DeleteAsync(string alias)
    {
        using var conn = Connect();
        var affectedRows = await conn.ExecuteAsync(
            "DELETE FROM urls WHERE alias = @alias",
            new { alias });

        return affectedRows > 0;
    }

    public async Task<IEnumerable<ShortenedUrl>> GetAllAsync()
    {
        using var conn = Connect();
        return await conn.QueryAsync<ShortenedUrl>(
            "SELECT alias, full_url AS FullUrl FROM urls ORDER BY created_at ASC");
    }

    public Task<ShortenedUrl?> GetByAliasAsync(string alias)
    {
        using var conn = Connect();

        return conn.QuerySingleOrDefaultAsync<ShortenedUrl>(
            "SELECT alias, full_url AS FullUrl FROM urls WHERE alias = @alias",
            new { alias });
    }
}
