using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;

namespace Api.Controllers;

[ApiController]
[Route("")]
public partial class UrlShortenerController(IUrlRepository repository) : ControllerBase
{
    private string GetCallerBaseUrl()
    {
        var origin = Request?.Headers["Origin"].ToString();

        if (Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
        {
            return $"{originUri.Scheme}://{originUri.Authority}".TrimEnd('/');
        }

        var request = HttpContext?.Request;
        return request is null
            ? string.Empty
            : $"{request.Scheme}://{request.Host}{request.PathBase}".TrimEnd('/');
    }

    /// <summary>Shorten a URL.</summary>
    /// <remarks>Returns a shortened URL for the supplied full URL.</remarks>
    [HttpPost("shorten")]
    [Produces("application/json")]
    [EndpointSummary("Shorten a URL")]
    [ProducesResponseType(typeof(ShortenResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Shorten([FromBody] ShortenRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.FullUrl))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        var fullUrl = request.FullUrl?.Trim();
        var alias = request.CustomAlias?.Trim();

        if (!Uri.TryCreate(fullUrl, UriKind.Absolute, out var parsedFullUrl)
            || (parsedFullUrl.Scheme != Uri.UriSchemeHttp && parsedFullUrl.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        if (!string.IsNullOrWhiteSpace(alias) && await repository.AliasExistsAsync(alias))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        alias = string.IsNullOrWhiteSpace(alias)
            ? await AliasGenerator.GenerateUniqueRandomAliasAsync(repository.AliasExistsAsync, 8)
            : alias;

        var baseUrl = GetCallerBaseUrl();
        var shortUrl = string.IsNullOrWhiteSpace(baseUrl)
            ? $"/{alias}"
            : $"{baseUrl}/{alias}";

        // Save the alias and URL to the repository
        await repository.AddAsync(new ShortenedUrl
        {
            Alias = alias,
            FullUrl = parsedFullUrl.ToString()
        });

        return Created($"/{alias}", new ShortenResponse(shortUrl));
    }

    /// <summary>Redirect to full URL.</summary>
    /// <remarks>Returns a 302 redirect to the original URL for the supplied alias.</remarks>
    [HttpGet("{alias}")]
    [EndpointSummary("Redirect to full URL")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RedirectToUrl(string alias)
    {
        var url = await repository.GetByAliasAsync(alias);
        if (url is null)
        {
            return NotFound();
        }

        return Redirect(url.FullUrl);
    }

    /// <summary>Delete a shortened URL.</summary>
    /// <remarks>Deletes the URL mapped to the supplied alias.</remarks>
    [HttpDelete("{alias}")]
    [EndpointSummary("Delete a shortened URL")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string alias)
    {
        if (string.IsNullOrWhiteSpace(alias) || !await repository.AliasExistsAsync(alias))
        {
            return NotFound();
        }

        var deleted = await repository.DeleteAsync(alias.Trim());

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>List all shortened URLs.</summary>
    /// <remarks>Returns every shortened URL stored in the database.</remarks>
    [HttpGet("urls")]
    [Produces("application/json")]
    [EndpointSummary("List all shortened URLs")]
    [ProducesResponseType(typeof(IEnumerable<ShortenedUrlResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var shortUrlPrefix = GetCallerBaseUrl();

        var urls = (await repository.GetAllAsync())
            .Select(url => new ShortenedUrlResponse
            {
                Alias = url.Alias,
                FullUrl = url.FullUrl,
                ShortUrl = string.IsNullOrWhiteSpace(shortUrlPrefix)
                    ? $"/{url.Alias}"
                    : $"{shortUrlPrefix}/{url.Alias}"
            })
            .ToList();

        return Ok(urls);
    }
}

public record ShortenRequest(string? FullUrl, string? CustomAlias);
public sealed record ShortenResponse(string ShortUrl);
