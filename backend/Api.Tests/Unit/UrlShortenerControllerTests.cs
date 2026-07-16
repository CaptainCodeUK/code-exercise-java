using Api.Controllers;
using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Http;
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

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Request = { Scheme = "https", Host = new HostString("short.ly") }
            }
        };

        _sut.HttpContext!.Request.Headers["Origin"] = "https://short.ly";
    }

    // --- POST /shorten ---

    [Fact]
    public async Task Shorten_ValidUrl_Returns201WithShortUrl()
    {
        _repo.AliasExistsAsync(Arg.Any<string>()).Returns(false);
        _repo.AddAsync(Arg.Any<ShortenedUrl>()).Returns(true);

        var request = new ShortenRequest("https://example.com/this/is/long", null);

        var result = await _sut.Shorten(request);

        var created = Assert.IsType<CreatedResult>(result);
        Assert.Equal(201, created.StatusCode);
        Assert.NotNull(created.Value);

        var shortUrl = created.Value as string
            ?? created.Value?.GetType().GetProperty("ShortUrl")?.GetValue(created.Value) as string;

        Assert.False(string.IsNullOrWhiteSpace(shortUrl));
        Assert.StartsWith("https://short.ly/", shortUrl);
        Assert.NotEqual(request.FullUrl, shortUrl);
    }

    [Fact]
    public async Task Shorten_WithCustomAlias_ShortUrlContainsAlias()
    {
        _repo.AliasExistsAsync(Arg.Any<string>()).Returns(false);
        _repo.AddAsync(Arg.Any<ShortenedUrl>()).Returns(true);

        var request = new ShortenRequest("https://example.com/this/is/long", "my-alias");

        var result = await _sut.Shorten(request);

        var created = Assert.IsType<CreatedResult>(result);
        Assert.Equal(201, created.StatusCode);
        Assert.NotNull(created.Value);

        var shortUrl = created.Value as string
            ?? created.Value?.GetType().GetProperty("ShortUrl")?.GetValue(created.Value) as string;

        Assert.False(string.IsNullOrWhiteSpace(shortUrl));
        Assert.StartsWith("https://short.ly/", shortUrl);
        Assert.Contains("my-alias", shortUrl);
        Assert.NotEqual(request.FullUrl, shortUrl);
    }

    [Fact]
    public async Task Shorten_DuplicateAlias_Returns400()
    {
        _repo.AliasExistsAsync("taken").Returns(true);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/this/is/long", "taken"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Shorten_MissingFullUrl_Returns400()
    {
        var result = await _sut.Shorten(new ShortenRequest(null, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Theory]
    [InlineData("urls")]
    [InlineData("shorten")]
    [InlineData("URLS")]
    public async Task Shorten_ReservedAlias_Returns400(string alias)
    {
        _repo.AliasExistsAsync(Arg.Any<string>()).Returns(false);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/this/is/long", alias));

        Assert.IsType<BadRequestObjectResult>(result);
        await _repo.DidNotReceive().AddAsync(Arg.Any<ShortenedUrl>());
    }

    // Simulates the race: the existence pre-check passes (alias free at that instant), but a
    // concurrent request wins the insert first, so the DB rejects this one on the primary key.
    [Fact]
    public async Task Shorten_CustomAliasWinsInsertRace_Returns400()
    {
        _repo.AliasExistsAsync("taken-by-racer").Returns(false);
        _repo.AddAsync(Arg.Any<ShortenedUrl>()).Returns(false);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/this/is/long", "taken-by-racer"));

        Assert.IsType<BadRequestObjectResult>(result);
        await _repo.Received(1).AddAsync(Arg.Any<ShortenedUrl>());
    }

    // A generated alias colliding with a concurrent insert should be retried, not surfaced as an error.
    [Fact]
    public async Task Shorten_GeneratedAliasCollidesOnce_RetriesAndReturns201()
    {
        _repo.AliasExistsAsync(Arg.Any<string>()).Returns(false);
        _repo.AddAsync(Arg.Any<ShortenedUrl>()).Returns(false, true);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/this/is/long", null));

        Assert.IsType<CreatedResult>(result);
        await _repo.Received(2).AddAsync(Arg.Any<ShortenedUrl>());
    }

    // Retries are unbounded — no cap, no failure response, since there's no caller to report
    // a "ran out of attempts" error to. Keep retrying until a free alias is found.
    [Fact]
    public async Task Shorten_GeneratedAliasCollidesRepeatedly_KeepsRetryingUntil201()
    {
        _repo.AliasExistsAsync(Arg.Any<string>()).Returns(false);
        _repo.AddAsync(Arg.Any<ShortenedUrl>()).Returns(false, false, false, false, true);

        var result = await _sut.Shorten(new ShortenRequest("https://example.com/this/is/long", null));

        Assert.IsType<CreatedResult>(result);
        await _repo.Received(5).AddAsync(Arg.Any<ShortenedUrl>());
    }

    // --- GET /{alias} ---

    [Fact]
    public async Task RedirectToUrl_ExistingAlias_Returns302()
    {
        _repo.GetByAliasAsync("foo").Returns(new ShortenedUrl
        {
            Alias = "foo",
            FullUrl = "https://example.com/target"
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
        _repo.AliasExistsAsync("bar").Returns(true);
        _repo.DeleteAsync("bar").Returns(true);

        var result = await _sut.Delete("bar");

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_UnknownAlias_Returns404()
    {
        _repo.AliasExistsAsync("ghost").Returns(false);
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
            new() { Alias = "a", FullUrl = "https://example.com/very/long/url/a" },
            new() { Alias = "b", FullUrl = "https://example.com/very/long/url/b" },
            new() { Alias = "c", FullUrl = "https://example.com/very/long/url/c" }
        });

        var result = await _sut.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<ShortenedUrlResponse>>(ok.Value).ToList();

        Assert.Equal(3, list.Count);
        Assert.Collection(list,
            item =>
            {
                Assert.Equal("a", item.Alias);
                Assert.Equal("https://example.com/very/long/url/a", item.FullUrl);
                Assert.Equal("https://short.ly/a", item.ShortUrl);
            },
            item =>
            {
                Assert.Equal("b", item.Alias);
                Assert.Equal("https://example.com/very/long/url/b", item.FullUrl);
                Assert.Equal("https://short.ly/b", item.ShortUrl);
            },
            item =>
            {
                Assert.Equal("c", item.Alias);
                Assert.Equal("https://example.com/very/long/url/c", item.FullUrl);
                Assert.Equal("https://short.ly/c", item.ShortUrl);
            });
    }
}
