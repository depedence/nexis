package nexis.ru.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import nexis.ru.entity.Page;
import nexis.ru.entity.PageType;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.entity.request.UpdatePageRequest;
import nexis.ru.entity.response.ExportFileResponse;
import nexis.ru.mapper.PageMapper;
import nexis.ru.repository.PageRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class PageService {

    private final PageRepository pageRepository;
    private final PageMapper pageMapper;

    public PageDto createPage(CreatePageRequest request) {
        if (request.getType() == null) {
            throw new IllegalArgumentException("Page type is required");
        }

        if (request.getParentId() != null) {
            Page parent = pageRepository.findById(request.getParentId())
                .orElseThrow(() -> new EntityNotFoundException("Parent not found"));

            if (parent.getType() != PageType.COLLECTION) {
                throw new IllegalArgumentException("Only collections can contain pages");
            }
        }

        LocalDateTime now = LocalDateTime.now();

        PageDto pageDto = new PageDto();
        pageDto.setParentId(request.getParentId());
        pageDto.setTitle(request.getTitle());
        if (request.getType() == PageType.COLLECTION) {
            pageDto.setContent(null);
        } else {
            pageDto.setContent(request.getContent() != null ? request.getContent() : "");
        }
        pageDto.setType(request.getType());
        pageDto.setPosition(request.getPosition());
        pageDto.setCreatedAt(now);
        pageDto.setUpdatedAt(now);

        Page savedPage = pageRepository.save(pageMapper.toEntity(pageDto));
        return pageMapper.toDto(savedPage);
    }

    public List<PageDto> getPages() {
        List<Page> pages = pageRepository.findAll();

        return pages.stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public PageDto getPageById(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        return pageMapper.toDto(page);
    }

    public PageDto updatePage(Long id, UpdatePageRequest request) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        page.setTitle(request.getTitle());
        page.setContent(request.getContent());
        page.setUpdatedAt(LocalDateTime.now());

        Page savedPage = pageRepository.save(page);
        return pageMapper.toDto(savedPage);
    }

    @Transactional
    public void deletePage(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));
        pageRepository.delete(page);
    }

    public List<PageDto> searchPages(String query) {
        List<Page> pages = pageRepository
        .findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(query, query);

        return pages.stream()
            .map(pageMapper::toDto)
            .toList();
    }

    public List<PageDto> getRootPages() {
        return pageRepository.findByParentIdIsNullOrderByPositionAsc()
                .stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public List<PageDto> getChildrenPages(Long parentId) {
        return pageRepository.findByParentIdOrderByPositionAsc(parentId)
                .stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public ExportFileResponse exportPage(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        if (page.getType() == PageType.NOTE) {
            return exportNote(page);
        }

        if (page.getType() == PageType.COLLECTION) {
            return exportCollection(page);
        }

        throw new IllegalArgumentException("Unsupported page type");
    }

    private ExportFileResponse exportNote(Page page) {
        String filename = sanitizeFilename(page.getTitle()) + ".md";

        String markdown = "# " + page.getTitle() + "\n\n" +
                (page.getContent() != null ? page.getContent() : "");

        return new ExportFileResponse(
                filename,
                "application/octet-stream",
                markdown.getBytes(StandardCharsets.UTF_8)
        );
    }

    private ExportFileResponse exportCollection(Page collection) {
        List<Page> children = pageRepository.findByParentIdOrderByPositionAsc(collection.getId());

        try {
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            ZipOutputStream zipOutputStream = new ZipOutputStream(byteArrayOutputStream);

            for (Page child : children) {
                if (child.getType() != PageType.NOTE) {
                    continue;
                }

                String filename = sanitizeFilename(child.getTitle()) + ".md";

                String markdown = "# " + child.getTitle() + "\n\n" +
                        (child.getContent() != null ? child.getContent() : "");

                ZipEntry entry = new ZipEntry(filename);
                zipOutputStream.putNextEntry(entry);
                zipOutputStream.write(markdown.getBytes(StandardCharsets.UTF_8));
                zipOutputStream.closeEntry();
            }

            zipOutputStream.close();

            return new ExportFileResponse(
                    sanitizeFilename(collection.getTitle()) + ".zip",
                    "application/zip",
                    byteArrayOutputStream.toByteArray()
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to export collection", e);
        }
    }

    private String sanitizeFilename(String filename) {
        return filename
                .replaceAll("[\\\\/:*?\"<>|]", "_")
                .trim();
    }
}
