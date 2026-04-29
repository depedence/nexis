package nexis.ru.controller;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.entity.request.UpdatePageRequest;
import nexis.ru.entity.response.MessageResponse;
import nexis.ru.service.PageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
