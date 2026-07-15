using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Api.OpenApi;

internal sealed class UrlShortenerDocumentTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Info = new OpenApiInfo
        {
            Title = "URL Shortener API",
            Version = "1.0.0",
            Description = "Simple RESTful API for shortening URLs."
        };

        return Task.CompletedTask;
    }
}
