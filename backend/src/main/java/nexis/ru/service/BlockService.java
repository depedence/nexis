package nexis.ru.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nexis.ru.entity.Block;
import nexis.ru.entity.Page;
import nexis.ru.entity.dto.BlockDto;
import nexis.ru.entity.request.CreateBlockRequest;
import nexis.ru.entity.request.ReorderBlockRequest;
import nexis.ru.entity.request.UpdateBlockRequest;
import nexis.ru.mapper.BlockMapper;
import nexis.ru.repository.BlockRepository;
import nexis.ru.repository.PageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;
    private final PageRepository pageRepository;
    private final BlockMapper blockMapper;

    public BlockDto createBlock(CreateBlockRequest request) {
        Page page = pageRepository.findById(request.getPageId())
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        LocalDateTime now = LocalDateTime.now();

        Block block = new Block();
        block.setPage(page);
        block.setType(request.getType());
        block.setContent(request.getContent());
        block.setPosition(request.getPosition());
        block.setCreatedAt(now);
        block.setUpdatedAt(now);

        Block savedBlock = blockRepository.save(block);
        return blockMapper.toDto(savedBlock);
    }

    public List<BlockDto> getBlocksByPageId(Long pageId) {
        List<Block> blocks = blockRepository.findByPage_IdOrderByPositionAsc(pageId);

        return blocks.stream()
                .map(blockMapper::toDto)
                .toList();
    }

    public BlockDto updateBlock(Long id, UpdateBlockRequest request) {
        Block block = blockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Block not found"));

        block.setType(request.getType());
        block.setContent(request.getContent());
        block.setUpdatedAt(LocalDateTime.now());

        Block savedBlock = blockRepository.save(block);
        return blockMapper.toDto(savedBlock);
    }

    public void reorderBlocks(Long pageId, List<ReorderBlockRequest> requests) {
        Map<Long, Integer> positions = requests.stream()
                .collect(Collectors.toMap(
                        ReorderBlockRequest::getId,
                        ReorderBlockRequest::getPosition
                ));

        List<Block> blocks = blockRepository.findAllById(positions.keySet());

        for (Block block : blocks) {
            if (!block.getPage().getId().equals(pageId)) {
                throw new IllegalArgumentException("Block does not belong to this page");
            }

            block.setPosition(positions.get(block.getId()));
            block.setUpdatedAt(LocalDateTime.now());
        }

        blockRepository.saveAll(blocks);
    }

    public void deleteBlock(Long id) {
        Block block = blockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Block not found"));
        blockRepository.delete(block);
    }
}