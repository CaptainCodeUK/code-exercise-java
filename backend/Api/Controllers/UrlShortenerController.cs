using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UrlShortenerController : ControllerBase
{
    // POST /shorten
    // 201: { shortUrl }
    // 400: invalid input or alias already taken
    [HttpPost("shorten")]
    public IActionResult Shorten([FromBody] ShortenRequest request)
    {
        throw new NotImplementedException();
    }

    // GET /{alias}
    // 302: redirect to full URL
    // 404: alias not found
    [HttpGet("{alias}")]
    public IActionResult RedirectToUrl(string alias)
    {
        throw new NotImplementedException();
    }

    // DELETE /{alias}
    // 204: deleted
    // 404: alias not found
    [HttpDelete("{alias}")]
    public IActionResult Delete(string alias)
    {
        throw new NotImplementedException();
    }

    // GET /urls
    // 200: array of { alias, fullUrl, shortUrl }
    [HttpGet("urls")]
    public IActionResult GetAll()
    {
        throw new NotImplementedException();
    }
}

public record ShortenRequest(string FullUrl, string? CustomAlias);
