using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests.Integration;

public class ShortenTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient(
        new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    // POST /shorten — valid fullUrl → 201 with shortUrl
    [Fact]
    public async Task PostShorten_ValidUrl_Returns201WithShortUrl()
    {
        var response = await _client.PostAsJsonAsync("/urlshortener/shorten", new
        {
            fullUrl = "https://example.com/very/long/url"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ShortenResponse>();
        Assert.NotNull(body?.ShortUrl);
        Assert.False(string.IsNullOrWhiteSpace(body.ShortUrl));
    }

    // POST /shorten — with customAlias → 201, shortUrl contains alias
    [Fact]
    public async Task PostShorten_WithCustomAlias_Returns201ContainingAlias()
    {
        var alias = "my-custom-alias";

        var response = await _client.PostAsJsonAsync("/urlshortener/shorten", new
        {
            fullUrl = "https://example.com/very/long/url",
            customAlias = alias
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ShortenResponse>();
        Assert.NotNull(body?.ShortUrl);
        Assert.Contains(alias, body.ShortUrl);
    }

    // POST /shorten — duplicate alias → 400
    [Fact]
    public async Task PostShorten_DuplicateAlias_Returns400()
    {
        var alias = "duplicate-alias";
        var payload = new { fullUrl = "https://example.com/url", customAlias = alias };

        await _client.PostAsJsonAsync("/urlshortener/shorten", payload);
        var response = await _client.PostAsJsonAsync("/urlshortener/shorten", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // POST /shorten — missing fullUrl → 400
    [Fact]
    public async Task PostShorten_MissingFullUrl_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/urlshortener/shorten", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private record ShortenResponse(string ShortUrl);
}
