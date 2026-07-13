using Api.Models;

namespace Api.Data;

public interface IUrlRepository
{
    Task<ShortenedUrl?> GetByAliasAsync(string alias);
    Task<IEnumerable<ShortenedUrl>> GetAllAsync();
    Task<bool> AliasExistsAsync(string alias);
    Task AddAsync(ShortenedUrl url);
    Task<bool> DeleteAsync(string alias);
}
