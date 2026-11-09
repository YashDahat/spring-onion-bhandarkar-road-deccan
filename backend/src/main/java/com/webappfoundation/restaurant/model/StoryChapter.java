package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** An admin-editable chapter of the Our Story timeline. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "story_chapter")
public class StoryChapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Small label above the title, e.g. "The promise" or a year. */
    private String eyebrow;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    private String imageUrl;

    @Builder.Default
    private int sortOrder = 0;

    @Builder.Default
    private boolean active = true;
}
