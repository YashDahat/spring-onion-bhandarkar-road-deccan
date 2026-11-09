package com.webappfoundation.restaurant.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.restaurant.dto.RestaurantDtos.StoryChapterDto;
import com.webappfoundation.restaurant.dto.RestaurantDtos.UpsertStoryChapterRequest;
import com.webappfoundation.restaurant.model.StoryChapter;
import com.webappfoundation.restaurant.repository.StoryChapterRepository;
import com.webappfoundation.service.AuditActions;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

import static com.webappfoundation.restaurant.RestaurantUtil.*;

/** Admin-editable chapters of the Our Story timeline. */
@Service
public class StoryService {

    private final StoryChapterRepository repository;
    private final SpreadsheetParser spreadsheetParser;
    private final AuditService auditService;

    public StoryService(StoryChapterRepository repository, SpreadsheetParser spreadsheetParser, AuditService auditService) {
        this.repository = repository;
        this.spreadsheetParser = spreadsheetParser;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<StoryChapterDto> listPublic() {
        return repository.findByActiveTrueOrderBySortOrderAsc().stream().map(StoryService::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<StoryChapterDto> adminList() {
        return repository.findAllByOrderBySortOrderAsc().stream().map(StoryService::toDto).toList();
    }

    @Transactional
    public StoryChapterDto create(UpsertStoryChapterRequest req) {
        validate(req);
        StoryChapter c = new StoryChapter();
        apply(c, req);
        StoryChapter saved = repository.save(c);
        auditService.record("STORY_CHAPTER_CREATED", AuditActions.SUCCESS, "STORY_CHAPTER", String.valueOf(saved.getId()), "title=" + saved.getTitle());
        return toDto(saved);
    }

    @Transactional
    public StoryChapterDto update(Long id, UpsertStoryChapterRequest req) {
        validate(req);
        StoryChapter c = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chapter not found"));
        apply(c, req);
        StoryChapter saved = repository.save(c);
        auditService.record("STORY_CHAPTER_UPDATED", AuditActions.SUCCESS, "STORY_CHAPTER", String.valueOf(id), "title=" + saved.getTitle());
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        StoryChapter c = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chapter not found"));
        repository.delete(c);
        auditService.record("STORY_CHAPTER_DELETED", AuditActions.SUCCESS, "STORY_CHAPTER", String.valueOf(id), "title=" + c.getTitle());
    }

    /** Columns: eyebrow,title,body,imageurl,sortorder */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNum = 1;
        for (Map<String, String> row : spreadsheetParser.parse(file)) {
            rowNum++;
            String title = row.getOrDefault("title", "").trim();
            String body = row.getOrDefault("body", "").trim();
            if (title.isEmpty()) { result.addError(rowNum, "title is required"); continue; }
            if (body.isEmpty()) { result.addError(rowNum, "body is required"); continue; }
            repository.save(StoryChapter.builder().eyebrow(blankToNull(row.get("eyebrow"))).title(title).body(body)
                    .imageUrl(blankToNull(row.get("imageurl"))).sortOrder(parseInt(row.get("sortorder"), 100)).active(true).build());
            result.setCreated(result.getCreated() + 1);
        }
        auditService.record("STORY_BULK_IMPORT", AuditActions.SUCCESS, "STORY_CHAPTER", null,
                "created=" + result.getCreated() + " failed=" + result.getFailed());
        return result;
    }

    private void validate(UpsertStoryChapterRequest req) {
        if (req == null || req.title() == null || req.title().isBlank()) throw bad("Title is required");
        if (req.body() == null || req.body().isBlank()) throw bad("Write a few lines for this chapter");
    }

    private void apply(StoryChapter c, UpsertStoryChapterRequest req) {
        c.setEyebrow(blankToNull(req.eyebrow()));
        c.setTitle(req.title().trim());
        c.setBody(req.body().trim());
        c.setImageUrl(blankToNull(req.imageUrl()));
        c.setSortOrder(req.sortOrder() == null ? 100 : req.sortOrder());
        c.setActive(req.active() == null || req.active());
    }

    public static StoryChapterDto toDto(StoryChapter c) {
        return new StoryChapterDto(c.getId(), c.getEyebrow(), c.getTitle(), c.getBody(), c.getImageUrl(), c.getSortOrder(), c.isActive());
    }
}
