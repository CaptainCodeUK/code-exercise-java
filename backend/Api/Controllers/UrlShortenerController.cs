using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UrlShortenerController(IUrlRepository repository) : ControllerBase
{
    // POST /urlshortener/shorten
    // 201: { shortUrl }
    // 400: invalid input or alias already taken
    [HttpPost("shorten")]
    public async Task<IActionResult> Shorten([FromBody] ShortenRequest request)
    {
        // Validate input
        if (request is null || string.IsNullOrWhiteSpace(request.FullUrl))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        var alias = request.CustomAlias;

        if (!string.IsNullOrWhiteSpace(alias) && await repository.AliasExistsAsync(alias))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        alias = string.IsNullOrWhiteSpace(alias)
            ? await AliasGenerator.GenerateUniqueRandomAliasAsync(repository.AliasExistsAsync, 8)
            : alias;

        // If we're calling from a frontend, we will return the full URL including the domain
        // Otherwise, we'll just return the alias
        var baseUrl = Request is null
            ? string.Empty
            : $"{Request.Scheme}://{Request.Host}{Request.PathBase}";

        var shortUrl = string.IsNullOrEmpty(baseUrl)
            ? $"/{alias}"
            : $"{baseUrl}/{alias}";

        // Save the alias and URL to the repository
        await repository.AddAsync(new ShortenedUrl
        {
            Alias = alias,
            FullUrl = request.FullUrl
        });

        return new CreatedResult(alias, new { shortUrl });
    }

    // GET /urlshortener/{alias}
    // 302: redirect to full URL
    // 404: alias not found
    [HttpGet("{alias}")]
    public async Task<IActionResult> RedirectToUrl(string alias)
    {
        throw new NotImplementedException();
    }

    // DELETE /urlshortener/{alias}
    // 204: deleted
    // 404: alias not found
    [HttpDelete("{alias}")]
    public async Task<IActionResult> Delete(string alias)
    {
        throw new NotImplementedException();
    }

    // GET /urlshortener/urls
    // 200: array of { alias, fullUrl, shortUrl }
    [HttpGet("urls")]
    public async Task<IActionResult> GetAll()
    {
        throw new NotImplementedException();
    }
}

public record ShortenRequest(string? FullUrl, string? CustomAlias);
