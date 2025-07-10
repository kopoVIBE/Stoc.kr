package com.stockr.be.community.domain;

import com.stockr.be.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;  // 제목

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;  // 내용

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;  // 작성자

    @Column(length = 10)
    private String stockCode;  // 관련 종목코드

    @Column(length = 50)
    private String stockName;  // 관련 종목명

    @Builder.Default
    private Integer likes = 0;  // 좋아요 수

    @Builder.Default
    private Integer commentCount = 0;  // 댓글 수

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_comment_time")
    private LocalDateTime lastCommentTime;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.lastCommentTime = this.createdAt;
    }

    public void updateLastCommentTime() {
        this.lastCommentTime = LocalDateTime.now();
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setStockCode(String stockCode) {
        this.stockCode = stockCode;
    }

    public void setStockName(String stockName) {
        this.stockName = stockName;
    }

    public void setLikes(Integer likes) {
        this.likes = likes;
    }

    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void incrementLikes() {
        this.likes++;
    }

    public void decrementLikes() {
        this.likes--;
    }

    public void incrementCommentCount() {
        this.commentCount++;
    }

    public void decrementCommentCount() {
        this.commentCount--;
    }
} 