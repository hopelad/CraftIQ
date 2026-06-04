using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using CraftIQ.Controllers;
using CraftIQ.Models;
using CraftIQ.Services;

namespace CraftIQ.Tests.Controllers
{
    public class RefactorControllerTests
    {
        private RefactorApiController CreateController(Mock<IRefactorService>? serviceMock = null)
        {
            serviceMock ??= new Mock<IRefactorService>();
            return new RefactorApiController(serviceMock.Object);
        }

        private static RefactorResponse MakeFakeResponse(string code = "// refactored") =>
            new RefactorResponse
            {
                RefactoredCode = code,
                Explanation = new List<string> { "Improved naming" },
                Smells = new List<CodeSmell>()
            };

        // ----------------------------------------------------------------
        // 1. Refactor returns Ok for valid C++ code
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_ReturnsOk_ForValidCppCode()
        {
            // Arrange
            var serviceMock = new Mock<IRefactorService>();
            serviceMock.Setup(s => s.RefactorAsync(It.IsAny<RefactorRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeFakeResponse());
            var controller = CreateController(serviceMock);

            var request = new RefactorRequest
            {
                Code = "#include <iostream>\nint main() { std::cout << \"Hello\" << std::endl; return 0; }",
                Language = "cpp"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        // ----------------------------------------------------------------
        // 2. Refactor returns BadRequest when Code is empty
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_ReturnsBadRequest_WhenCodeIsEmpty()
        {
            // Arrange
            var controller = CreateController();
            var request = new RefactorRequest { Code = "", Language = "cpp" };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 3. Refactor returns BadRequest for non-C++ code (Python)
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_ReturnsBadRequest_ForNonCppCode()
        {
            // Arrange
            var controller = CreateController();
            var request = new RefactorRequest
            {
                Code = "def greet():\n    print('Hello')\n\ngreet()",
                Language = "python"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 4. Refactor returns 500 when service throws
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_Returns500_WhenServiceThrows()
        {
            // Arrange
            var serviceMock = new Mock<IRefactorService>();
            serviceMock.Setup(s => s.RefactorAsync(It.IsAny<RefactorRequest>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("AI service unavailable"));
            var controller = CreateController(serviceMock);

            var request = new RefactorRequest
            {
                Code = "#include <iostream>\nint main() { std::cout << \"Hello\"; return 0; }",
                Language = "cpp"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusResult.StatusCode);
        }

        // ----------------------------------------------------------------
        // 5. Refactor detects #include as valid C++ pattern
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_DetectsValidCppPatterns_IncludesHashInclude()
        {
            // Arrange
            var serviceMock = new Mock<IRefactorService>();
            serviceMock.Setup(s => s.RefactorAsync(It.IsAny<RefactorRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeFakeResponse());
            var controller = CreateController(serviceMock);

            var request = new RefactorRequest
            {
                Code = "#include <vector>\n#include <string>\nvoid process(std::vector<int>& data) { }",
                Language = "cpp"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert — should accept, not reject
            Assert.IsType<OkObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 6. Refactor detects cout << as valid C++ pattern
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_DetectsValidCppPatterns_IncludesCout()
        {
            // Arrange
            var serviceMock = new Mock<IRefactorService>();
            serviceMock.Setup(s => s.RefactorAsync(It.IsAny<RefactorRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeFakeResponse());
            var controller = CreateController(serviceMock);

            var request = new RefactorRequest
            {
                Code = "void display() { cout << \"Result: \" << 42 << endl; }",
                Language = "cpp"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert — cout << is a valid C++ indicator
            Assert.IsType<OkObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 7. Refactor rejects Java code with System.out.println
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_RejectsJavaCode_WithSystemOutPrintln()
        {
            // Arrange
            var controller = CreateController();

            var request = new RefactorRequest
            {
                Code = "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello\");\n    }\n}",
                Language = "java"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ----------------------------------------------------------------
        // 8. Refactor rejects JavaScript code with console.log
        // ----------------------------------------------------------------
        [Fact]
        public async Task Refactor_RejectsJavaScriptCode_WithConsoleLog()
        {
            // Arrange
            var controller = CreateController();

            var request = new RefactorRequest
            {
                Code = "function greet(name) {\n    console.log('Hello, ' + name);\n}\n\nlet x = 5;\nconst y = 10;",
                Language = "javascript"
            };

            // Act
            var result = await controller.Refactor(request, CancellationToken.None);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
