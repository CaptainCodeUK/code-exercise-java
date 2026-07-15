using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("[controller]")]
public partial class UrlShortenerController(IUrlRepository repository) : ControllerBase
{
    // POST /urlshortener/shorten
    // 201: { shortUrl }
    // 400: invalid input or alias already taken
    [HttpPost("shorten")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ShortenResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Shorten([FromBody] ShortenRequest request)
    {
        // Validate input
        if (request is null || string.IsNullOrWhiteSpace(request.FullUrl))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        var fullUrl = request.FullUrl?.Trim();
        var alias = request.CustomAlias?.Trim();

        if (!string.IsNullOrWhiteSpace(alias) && await repository.AliasExistsAsync(alias))
        {
            return BadRequest("Invalid input or alias already taken");
        }

        alias = string.IsNullOrWhiteSpace(alias)
            ? await AliasGenerator.GenerateUniqueRandomAliasAsync(repository.AliasExistsAsync, 8)
            : alias;

        // If we're calling from a frontend, we will return the full URL including the domain
        // Otherwise, we'll just return the alias
        var shortUrl = Request is null
            ? $"/{alias}"
            : $"{Request.Scheme}://{Request.Host}{Request.PathBase}/{alias}";

        // Save the alias and URL to the repository
        await repository.AddAsync(new ShortenedUrl
        {
            Alias = alias,
            FullUrl = fullUrl!
        });

        return Created($"/{alias}", new ShortenResponse(shortUrl));
    }

    // GET /urlshortener/{alias}
    // 302: redirect to full URL
    // 404: alias not found
    [HttpGet("{alias}")]
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

    // DELETE /urlshortener/{alias}
    // 204: deleted
    // 404: alias not found
    [HttpDelete("{alias}")]
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

    // GET /urlshortener/urls
    // 200: array of { alias, fullUrl, shortUrl }
    [HttpGet("urls")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(IEnumerable<ShortenedUrlResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var request = HttpContext?.Request;
        var shortUrlPrefix = request is null
            ? string.Empty
            : $"{request.Scheme}://{request.Host}{request.PathBase}".TrimEnd('/');

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
