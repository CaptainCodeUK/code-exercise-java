using Api.Models;

namespace Api.Data;

public interface IUrlRepository
{
    Task<ShortenedUrl?> GetByAliasAsync(string alias);
    Task<IEnumerable<ShortenedUrl>> GetAllAsync();
    Task<bool> AliasExistsAsync(string alias);

    /// <summary>Inserts the URL. Returns false instead of throwing if the alias is already taken.</summary>
    Task<bool> AddAsync(ShortenedUrl url);
    Task<bool> DeleteAsync(string alias);
}
