using Api.Models;

namespace Api.Data;

public class UrlRepository : IUrlRepository
{
    public Task AddAsync(ShortenedUrl url)
    {
        // This method should add the ShortenedUrl to the database.
        return Task.CompletedTask;
    }

    public Task<bool> AliasExistsAsync(string alias)
    {
        // This method should check if the alias already exists in the database.
        // We have no database yet, so for now, we can just return false to indicate that the alias does not exist.

        return Task.FromResult(false);
    }

    public Task<bool> DeleteAsync(string alias)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ShortenedUrl>> GetAllAsync()
    {
        throw new NotImplementedException();
    }

    public Task<ShortenedUrl?> GetByAliasAsync(string alias)
    {
        throw new NotImplementedException();
    }
}
