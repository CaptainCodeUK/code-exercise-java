using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests.Integration;

public class RedirectTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient(
        new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    // GET /{alias} — existing alias → 302
    [Fact]
    public async Task GetAlias_ExistingAlias_Returns302()
    {
        var alias = "redirect-alias";
        await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl = "https://example.com/target",
            customAlias = alias
        });

        var response = await _client.GetAsync($"/{alias}");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("https://example.com/target", response.Headers.Location?.ToString());
    }

    // GET /{alias} — unknown alias → 404
    [Fact]
    public async Task GetAlias_UnknownAlias_Returns404()
    {
        var response = await _client.GetAsync("/this-alias-does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
