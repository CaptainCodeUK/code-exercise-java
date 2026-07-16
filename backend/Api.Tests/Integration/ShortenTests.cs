using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests.Integration;

public class ShortenTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = CreateClient(factory);

    private static HttpClient CreateClient(TestWebApplicationFactory factory)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("Origin", "https://app.local");
        return client;
    }

    private static string NewAlias(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    // POST /shorten — valid fullUrl → 201 with shortUrl
    [Fact]
    public async Task PostShorten_ValidUrl_Returns201WithShortUrl()
    {
        var response = await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl = "https://example.com/very/long/url"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ShortenResponse>();
        Assert.NotNull(body?.ShortUrl);
        Assert.False(string.IsNullOrWhiteSpace(body.ShortUrl));
        Assert.StartsWith("https://app.local/", body.ShortUrl);
    }

    // POST /shorten — with customAlias → 201, shortUrl contains alias
    [Fact]
    public async Task PostShorten_WithCustomAlias_Returns201ContainingAlias()
    {
        var alias = NewAlias("my-custom-alias");

        var response = await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl = "https://example.com/very/long/url",
            customAlias = alias
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ShortenResponse>();
        Assert.NotNull(body?.ShortUrl);
        Assert.StartsWith("https://app.local/", body.ShortUrl);
        Assert.Contains(alias, body.ShortUrl);
    }

    // POST /shorten — with punctuation in customAlias → 201, shortUrl contains alias
    [Fact]
    public async Task PostShorten_WithPunctuationAlias_Returns201ContainingAlias()
    {
        var alias = "launch.notes_2026";

        var response = await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl = "https://example.com/very/long/url",
            customAlias = alias
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ShortenResponse>();
        Assert.NotNull(body?.ShortUrl);
        Assert.StartsWith("https://app.local/", body.ShortUrl);
        Assert.Contains(alias, body.ShortUrl);
    }

    // POST /shorten — duplicate alias → 400
    [Fact]
    public async Task PostShorten_DuplicateAlias_Returns400()
    {
        var alias = "duplicate-alias";
        var payload = new { fullUrl = "https://example.com/url", customAlias = alias };

        await _client.PostAsJsonAsync("/shorten", payload);
        var response = await _client.PostAsJsonAsync("/shorten", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // POST /shorten — missing fullUrl → 400
    [Fact]
    public async Task PostShorten_MissingFullUrl_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/shorten", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // POST /shorten — invalid fullUrl → 400
    [Fact]
    public async Task PostShorten_InvalidFullUrl_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl = "not-a-url"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private record ShortenResponse(string ShortUrl);
}
