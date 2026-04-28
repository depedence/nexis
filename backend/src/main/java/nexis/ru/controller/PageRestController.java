package nexis.ru.controller;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.dto.BlockDto;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.entity.request.ReorderBlockRequest;
import nexis.ru.entity.request.UpdatePageRequest;
import nexis.ru.entity.response.MessageResponse;
import nexis.ru.service.BlockService;
import nexis.ru.service.PageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class PageRestController {

    private final PageService pageService;
    private final BlockService blockService;

    @PostMapping
    public PageDto createPage(@RequestBody CreatePageRequest request) {
        return pageService.createPage(request);
    }

    @GetMapping
    public List<PageDto> getPages() {
        return pageService.getPages();
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

    @GetMapping("/{id}/blocks")
    public List<BlockDto> getBlocks(@PathVariable Long id) {
        return blockService.getBlocksByPageId(id);
    }

    @PatchMapping("/{id}/blocks/reorder")
    public ResponseEntity<MessageResponse> reorderBlocks(@PathVariable Long id, @RequestBody List<ReorderBlockRequest> requests) {
        blockService.reorderBlocks(id, requests);
        return ResponseEntity.ok(new MessageResponse("Blocks reordered successfully"));
    }
}