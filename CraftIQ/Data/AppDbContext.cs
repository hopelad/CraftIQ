using CraftIQ.Models;
using Microsoft.EntityFrameworkCore;

namespace CraftIQ.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<CVRecord>       CVRecords       { get; set; }
        public DbSet<CVAutoSave>     CVAutoSaves     { get; set; }
        public DbSet<AnalysisReport> AnalysisReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CVRecord>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.UserId).IsRequired();
                e.Property(x => x.CVDataJson).IsRequired(false);
                e.Property(x => x.FormDataJson).IsRequired(false);
                e.Property(x => x.PhotoBase64).IsRequired(false);
                e.HasIndex(x => x.UserId);
            });

            modelBuilder.Entity<CVAutoSave>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.UserId).IsRequired();
                e.Property(x => x.FormDataJson).IsRequired(false);
                e.Property(x => x.PhotoBase64).IsRequired(false);
                e.HasIndex(x => x.UserId);
            });

            modelBuilder.Entity<AnalysisReport>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.UserId).IsRequired();
                e.Property(x => x.ResultJson).IsRequired(false);
                e.HasIndex(x => x.UserId);
            });
        }
    }
}