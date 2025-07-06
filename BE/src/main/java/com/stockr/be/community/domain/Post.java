package com.stockr.be.community.domain;

import com.stockr.be.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;  // 글 제목

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;  // 글 내용

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;  // 작성자

    @Column(length = 10)
    private String stockCode;  // 관련 종목 코드

    @Column(length = 50)
    private String stockName;  // 관련 종목명

    @Column(nullable = false, columnDefinition = "int default 0")
    private Integer likes = 0;  // 좋아요 수

    @Column(nullable = false, columnDefinition = "int default 0")
    private Integer commentCount = 0;  // 댓글 수

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;  // 작성 시간

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;  // 수정 시간
} 