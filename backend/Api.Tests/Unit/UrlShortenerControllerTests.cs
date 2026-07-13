using Api.Controllers;
using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace Api.Tests.Unit;

public class UrlShortenerControllerTests
{
    private readonly IUrlRepository _repo = Substitute.For<IUrlRepository>();
    private readonly UrlShortenerController _sut;

    public UrlShortenerControllerTests()
    {
        _sut = new UrlShortenerController(_repo);
    }

    // --- POST /shorten ---

    [Fact]
    public async Task Shorten_ValidUrl_Returns201WithShortUrl()
    {
        _repo.AliasExistsAsync(Arg.Any<string>()).Returns(false);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/long", null));

        var created = Assert.IsType<CreatedResult>(result);
        Assert.NotNull(created.Value);
    }

    [Fact]
    public async Task Shorten_WithCustomAlias_ShortUrlContainsAlias()
    {
        _repo.AliasExistsAsync("my-alias").Returns(false);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/long", "my-alias"));

        var created = Assert.IsType<CreatedResult>(result);
        var shortUrl = created.Value?.GetType().GetProperty("shortUrl")?.GetValue(created.Value)?.ToString();
        Assert.Contains("my-alias", shortUrl);
    }

    [Fact]
    public async Task Shorten_DuplicateAlias_Returns400()
    {
        _repo.AliasExistsAsync("taken").Returns(true);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/long", "taken"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Shorten_MissingFullUrl_Returns400()
    {
        var result = await _sut.Shorten(new ShortenRequest(null, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // --- GET /{alias} ---

    [Fact]
    public async Task RedirectToUrl_ExistingAlias_Returns302()
    {
        _repo.GetByAliasAsync("foo").Returns(new ShortenedUrl
        {
            Alias = "foo",
            FullUrl = "https://example.com/target",
            ShortUrl = "https://localhost/foo"
        });

        var result = await _sut.RedirectToUrl("foo");

        var redirect = Assert.IsType<RedirectResult>(result);
        Assert.Equal("https://example.com/target", redirect.Url);
        Assert.True(redirect.Permanent == false);
    }

    [Fact]
    public async Task RedirectToUrl_UnknownAlias_Returns404()
    {
        _repo.GetByAliasAsync("nope").Returns((ShortenedUrl?)null);

        var result = await _sut.RedirectToUrl("nope");

        Assert.IsType<NotFoundResult>(result);
    }

    // --- DELETE /{alias} ---

    [Fact]
    public async Task Delete_ExistingAlias_Returns204()
    {
        _repo.DeleteAsync("bar").Returns(true);

        var result = await _sut.Delete("bar");

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_UnknownAlias_Returns404()
    {
        _repo.DeleteAsync("ghost").Returns(false);

        var result = await _sut.Delete("ghost");

        Assert.IsType<NotFoundResult>(result);
    }

    // --- GET /urls ---

    [Fact]
    public async Task GetAll_Returns200WithList()
    {
        _repo.GetAllAsync().Returns(new List<ShortenedUrl>
        {
            new() { Alias = "a", FullUrl = "https://a.com", ShortUrl = "https://localhost/a" }
        });

        var result = await _sut.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<ShortenedUrl>>(ok.Value);
        Assert.Single(list);
    }
}
