package nexis.ru.controller;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.entity.request.SetFavoriteRequest;
import nexis.ru.entity.request.UpdatePageRequest;
import nexis.ru.entity.response.ExportFileResponse;
import nexis.ru.entity.response.MessageResponse;
import nexis.ru.service.PageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class PageRestController {

    private final PageService pageService;

    @PostMapping
    public PageDto createPage(@RequestBody CreatePageRequest request) {
        return pageService.createPage(request);
    }

    @GetMapping
    public List<PageDto> getPages() {
        return pageService.getPages();
    }

    @GetMapping("/search")
    public List<PageDto> searchPages(@RequestParam String q) {
        return pageService.searchPages(q);
    }

    @GetMapping("/root")
    public List<PageDto> getRootPages() {
        return pageService.getRootPages();
    }

    @PostMapping("/import/markdown")
    public PageDto importMarkdown(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long parentId
    ) {
        return pageService.importMarkdown(file, parentId);
    }

    @PostMapping("/import/zip")
    public PageDto importZip(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long parentId
    ) {
        return pageService.importZip(file, parentId);
    }

    @GetMapping("/favorites")
    public List<PageDto> getFavoritePages() {
        return pageService.getFavoritePages();
    }

    @PatchMapping("/{id}/favorite")
    public PageDto setFavorite(
            @PathVariable Long id,
            @RequestBody SetFavoriteRequest request
    ) {
        return pageService.setFavorite(id, request);
    }

    @GetMapping("/{id}/children")
    public List<PageDto> getChildrenPages(@PathVariable Long id) {
        return pageService.getChildrenPages(id);
    }

    @GetMapping("/{id}")
    public PageDto getPageById(@PathVariable Long id) {
        return pageService.getPageById(id);
    }

    @PatchMapping("/{id}")
    public PageDto updatePage(@PathVariable Long id, @RequestBody UpdatePageRequest request) {
        return pageService.updatePage(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deletePage(@PathVariable Long id) {
        pageService.deletePage(id);
        return ResponseEntity.ok(new MessageResponse("Page successfully deleted"));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportPage(@PathVariable Long id) {
        ExportFileResponse file = pageService.exportPage(id);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + URLEncoder.encode(file.filename(), StandardCharsets.UTF_8)
                )
                .contentType(MediaType.parseMediaType(file.contentType()))
                .body(file.bytes());
    }
}
