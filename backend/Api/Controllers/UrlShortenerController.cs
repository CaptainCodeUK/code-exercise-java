using Api.Data;
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
        throw new NotImplementedException();
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
