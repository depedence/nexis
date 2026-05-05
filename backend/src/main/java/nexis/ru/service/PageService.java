package nexis.ru.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import nexis.ru.entity.Page;
import nexis.ru.entity.PageType;
import nexis.ru.entity.User;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.entity.request.SetFavoriteRequest;
import nexis.ru.entity.request.UpdatePageRequest;
import nexis.ru.entity.response.ExportFileResponse;
import nexis.ru.mapper.PageMapper;
import nexis.ru.repository.PageRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
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

        Page parent = null;
        if (request.getParentId() != null) {
            parent = pageRepository.findByIdAndUser(request.getParentId(), getCurrentUser())
                .orElseThrow(() -> new EntityNotFoundException("Parent not found"));

            if (parent.getType() != PageType.COLLECTION) {
                throw new IllegalArgumentException("Only collections can contain pages");
            }
        }

        LocalDateTime now = LocalDateTime.now();

        Page page = new Page();
        page.setParentId(parent != null ? parent.getId() : null);
        page.setTitle(request.getTitle());
        page.setType(request.getType());
        page.setPosition(request.getPosition());
        page.setCreatedAt(now);
        page.setUpdatedAt(now);

        if (request.getType() == PageType.COLLECTION) {
            page.setContent(null);
        } else {
            page.setContent(request.getContent() != null ? request.getContent() : "");
        }

        page.setUser(getCurrentUser());

        Page savedPage = pageRepository.save(page);
        return pageMapper.toDto(savedPage);
    }

    public List<PageDto> getPages() {
        List<Page> pages = pageRepository.findByUser(getCurrentUser());

        return pages.stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public PageDto getPageById(Long id) {
        Page page = pageRepository.findByIdAndUser(id, getCurrentUser())
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        return pageMapper.toDto(page);
    }

    public PageDto updatePage(Long id, UpdatePageRequest request) {
        Page page = pageRepository.findByIdAndUser(id, getCurrentUser())
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        page.setTitle(request.getTitle());

        if (page.getType() == PageType.COLLECTION) {
            page.setContent(null);
        } else {
            page.setContent(request.getContent() != null ? request.getContent() : null);
        }

        page.setUpdatedAt(LocalDateTime.now());

        Page savedPage = pageRepository.save(page);
        return pageMapper.toDto(savedPage);
    }

    @Transactional
    public void deletePage(Long id) {
        Page page = pageRepository.findByIdAndUser(id, getCurrentUser())
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));
        if (page.getType() == PageType.COLLECTION) {
            pageRepository.deleteAllByParentIdAndUser(id, getCurrentUser());
        }
        pageRepository.delete(page);
    }

    public List<PageDto> searchPages(String query) {
        List<Page> pages = pageRepository.search(getCurrentUser(), query);

        return pages.stream()
            .map(pageMapper::toDto)
            .toList();
    }

    public List<PageDto> getRootPages() {
        return pageRepository.findByParentIdIsNullOrderByPositionAsc(getCurrentUser())
                .stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public List<PageDto> getChildrenPages(Long parentId) {
        return pageRepository.findByParentIdOrderByPositionAsc(parentId, getCurrentUser())
                .stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public ExportFileResponse exportPage(Long id) {
        Page page = pageRepository.findByIdAndUser(id, getCurrentUser())
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        if (page.getType() == PageType.NOTE) {
            return exportNote(page);
        }

        if (page.getType() == PageType.COLLECTION) {
            return exportCollection(page);
        }

        throw new IllegalArgumentException("Unsupported page type");
    }

    public PageDto importMarkdown(MultipartFile file, Long parentId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".md")) {
            throw new IllegalArgumentException("Only .md files are supported");
        }

        Page parent = null;
        if (parentId != null) {
            parent = pageRepository.findByIdAndUser(parentId, getCurrentUser())
                    .orElseThrow(() -> new EntityNotFoundException("Parent not found"));
            if (parent.getType() != PageType.COLLECTION) {
                throw new IllegalArgumentException("Only collections can contain imported notes");
            }
        }

        String content;
        try {
            content = new String(file.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read markdown file", e);
        }

        String title = originalFilename.substring(0, originalFilename.length() - 3);
        LocalDateTime now = LocalDateTime.now();

        Page page = new Page();
        page.setParentId(parentId != null ? parent.getId() : null);
        page.setTitle(title);
        page.setContent(content);
        page.setType(PageType.NOTE);
        page.setPosition(0);
        page.setCreatedAt(now);
        page.setUpdatedAt(now);
        page.setUser(getCurrentUser());

        Page savedPage = pageRepository.save(page);

        return pageMapper.toDto(savedPage);
    }

    public PageDto importZip(MultipartFile file, Long parentId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".zip")) {
            throw new IllegalArgumentException("Only .zip files are supported");
        }

        if (parentId != null) {
            Page grandParent = pageRepository.findByIdAndUser(parentId, getCurrentUser())
                    .orElseThrow(() -> new EntityNotFoundException("Page not found"));
            if (grandParent.getType() != PageType.COLLECTION) {
                throw new IllegalArgumentException("Only collection can contain imported notes");
            }
        }

        String collectionTitle = originalFilename.substring(0, originalFilename.length() - 4);
        LocalDateTime now = LocalDateTime.now();

        Page collection = new Page();
        collection.setParentId(parentId);
        collection.setTitle(collectionTitle);
        collection.setType(PageType.COLLECTION);
        collection.setPosition(0);
        collection.setCreatedAt(now);
        collection.setUpdatedAt(now);
        collection.setUser(getCurrentUser());

        Page savedCollection = pageRepository.save(collection);

        try (ZipInputStream zipIn = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            int position = 0;

            while ((entry = zipIn.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    zipIn.closeEntry();
                    continue;
                }

                String entryName = entry.getName();
                if (!entryName.toLowerCase().endsWith(".md")) {
                    zipIn.closeEntry();
                    continue;
                }

                String fileName = Paths.get(entryName).getFileName().toString();
                String pageTitle = fileName.substring(0, fileName.length() - 3);
                String content = new String(zipIn.readAllBytes(), StandardCharsets.UTF_8);

                Page note = new Page();
                note.setParentId(savedCollection.getId());
                note.setTitle(pageTitle);
                note.setContent(content);
                note.setType(PageType.NOTE);
                note.setPosition(position++);
                note.setCreatedAt(now);
                note.setUpdatedAt(now);
                note.setUser(getCurrentUser());

                pageRepository.save(note);

                zipIn.closeEntry();
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read zip file ", e);
        }

        return pageMapper.toDto(savedCollection);
    }

    public List<PageDto> getFavoritePages() {
        List<Page> pages = pageRepository
            .findByTypeAndFavoriteTrueOrderByUpdatedAtDesc(PageType.NOTE, getCurrentUser());

        return pages.stream()
            .map(pageMapper::toDto)
            .toList();
    }

    public PageDto setFavorite(Long id, SetFavoriteRequest request) {
        Page page = pageRepository.findByIdAndUser(id, getCurrentUser())
            .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        if (page.getType() == PageType.COLLECTION) {
            throw new IllegalArgumentException("Only notes can be added to favorites");
        }

        page.setFavorite(request.isFavorite());
        page.setUpdatedAt(LocalDateTime.now());

        Page savedPage = pageRepository.save(page);
        return pageMapper.toDto(savedPage);
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
        List<Page> children = pageRepository.findByParentIdOrderByPositionAsc(collection.getId(), getCurrentUser());

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

    private User getCurrentUser() {
        return (User) Objects.requireNonNull(
                SecurityContextHolder
                        .getContext()
                        .getAuthentication())
                .getPrincipal();
    }
}
