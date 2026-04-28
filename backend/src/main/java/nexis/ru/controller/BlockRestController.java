package nexis.ru.controller;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.dto.BlockDto;
import nexis.ru.entity.request.CreateBlockRequest;
import nexis.ru.entity.request.ReorderBlockRequest;
import nexis.ru.entity.request.UpdateBlockRequest;
import nexis.ru.entity.response.MessageResponse;
import nexis.ru.service.BlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
public class BlockRestController {

    private final BlockService blockService;

    @PostMapping
    public BlockDto createBlock(@RequestBody CreateBlockRequest request) {
        return blockService.createBlock(request);
    }

    @PatchMapping("/{id}")
    public BlockDto updateBlock(@PathVariable Long id, @RequestBody UpdateBlockRequest request) {
        return blockService.updateBlock(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteBlock(@PathVariable Long id) {
        blockService.deleteBlock(id);
        return ResponseEntity.ok(new MessageResponse("Block successfully deleted"));
    }
}