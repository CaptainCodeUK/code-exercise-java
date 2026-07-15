using Api.Data;
using Api.OpenApi;
using Dapper;
using DbUp;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

var connectionStringBuilder = new SqliteConnectionStringBuilder(builder.Configuration.GetConnectionString("Default")!);

if (!Path.IsPathRooted(connectionStringBuilder.DataSource))
{
    connectionStringBuilder.DataSource = Path.GetFullPath(
        Path.Combine(AppContext.BaseDirectory, connectionStringBuilder.DataSource));
}

var connectionString = connectionStringBuilder.ToString();

// Run DbUp migrations on startup
var upgrader = DeployChanges.To
    .SqliteDatabase(connectionString)
    .WithScriptsEmbeddedInAssembly(typeof(Program).Assembly)
    .LogToConsole()
    .Build();

var result = upgrader.PerformUpgrade();
if (!result.Successful)
    throw new Exception("Database migration failed", result.Error);

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<UrlShortenerDocumentTransformer>();
});
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddSingleton<IUrlRepository>(_ => new UrlRepository(connectionString));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("DevCors");
app.MapControllers();

app.Run();

public partial class Program { }
