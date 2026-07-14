using Api.Models;
using Dapper;
using Microsoft.Data.Sqlite;

namespace Api.Data;

public class UrlRepository(string connectionString) : IUrlRepository
{
    private SqliteConnection Connect() => new(connectionString);

    public async Task AddAsync(ShortenedUrl url)
    {
        using var conn = Connect();
        await conn.ExecuteAsync(
            "INSERT INTO urls (alias, full_url) VALUES (@Alias, @FullUrl)",
            url);
    }

    public async Task<bool> AliasExistsAsync(string alias)
    {
        using var conn = Connect();
        var count = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM urls WHERE alias = @alias",
            new { alias });

        return count > 0;
    }

    public Task<bool> DeleteAsync(string alias)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<ShortenedUrl>> GetAllAsync()
    {
        using var conn = Connect();
        return await conn.QueryAsync<ShortenedUrl>(
            "SELECT alias, full_url AS FullUrl FROM urls ORDER BY created_at ASC");
    }

    public Task<ShortenedUrl?> GetByAliasAsync(string alias)
    {
        throw new NotImplementedException();
    }
}
