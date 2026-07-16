using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests.Integration;

public class ListUrlsTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = CreateClient(factory);

    private static HttpClient CreateClient(TestWebApplicationFactory factory)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("Origin", "https://app.local");
        return client;
    }

    // GET /urls → 200 with array
    [Fact]
    public async Task GetUrls_Returns200WithArray()
    {
        var response = await _client.GetAsync("/urls");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<UrlEntry[]>();
        Assert.NotNull(body);
    }

    // GET /urls — after adding entry, list contains it
    [Fact]
    public async Task GetUrls_AfterShorten_ContainsEntry()
    {
        var alias = "list-alias";
        var fullUrl = "https://example.com/list-test";

        await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl,
            customAlias = alias
        });

        var response = await _client.GetAsync("/urls");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<UrlEntry[]>();
        Assert.NotNull(body);

        var entry = Array.Find(body, e => e.Alias == alias);
        Assert.NotNull(entry);
        Assert.Equal(fullUrl, entry.FullUrl);
        Assert.StartsWith("https://app.local/", entry.ShortUrl);
        Assert.Contains(alias, entry.ShortUrl);
    }

    private record UrlEntry(string Alias, string FullUrl, string ShortUrl);
}
