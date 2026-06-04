using CraftIQ.Models;
using CraftIQ.Services;
using Microsoft.AspNetCore.Mvc;

namespace CraftIQ.Controllers
{
    [ApiController]
    [Route("api/refactor")]
    public class RefactorApiController : ControllerBase
    {
        private readonly IRefactorService _service;
        private readonly ILogger<RefactorApiController> _logger;

        public RefactorApiController(IRefactorService service, ILogger<RefactorApiController> logger)
        {
            _service = service;
            _logger  = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Refactor(
            [FromBody] RefactorRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { message = "Please enter C/C++ code." });

            if (!LooksLikeCOrCpp(request.Code))
                return BadRequest(new { message = "Only C/C++ code is supported." });

            request.Language = "cpp";

            try
            {
                var result = await _service.RefactorAsync(request, cancellationToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Refactor failed: {Message}", ex.Message);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        private bool LooksLikeCOrCpp(string code)
        {
            string[] cCppPatterns =
            {
                "#include", "int main(", "using namespace std",
                "std::", "cout <<", "cin >>", "printf(", "scanf(",
                "malloc(", "free(", "class ", "struct ",
                "->", "nullptr", "new ", "delete "
            };

            string[] otherLanguagePatterns =
            {
                "System.out.println", "public static void main",
                "import java.", "def ", "console.log",
                "using System", "<?php", "fn main()", "package main", "func main()"
            };

            foreach (var pattern in otherLanguagePatterns)
                if (code.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return false;

            foreach (var pattern in cCppPatterns)
                if (code.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return true;

            return false;
        }
    }
}