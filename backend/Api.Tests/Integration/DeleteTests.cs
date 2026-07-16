using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests.Integration;

public class DeleteTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient(
        new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    // DELETE /{alias} — existing alias → 204
    [Fact]
    public async Task DeleteAlias_ExistingAlias_Returns204()
    {
        var alias = "delete-me";
        await _client.PostAsJsonAsync("/shorten", new
        {
            fullUrl = "https://example.com/to-delete",
            customAlias = alias
        });

        var response = await _client.DeleteAsync($"/{alias}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // DELETE /{alias} — unknown alias → 404
    [Fact]
    public async Task DeleteAlias_UnknownAlias_Returns404()
    {
        var response = await _client.DeleteAsync("/alias-that-never-existed");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
