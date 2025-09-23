const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const port = 8001;

// CORS 설정
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// 노션 클라이언트 초기화
const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
});

// 데이터베이스 조회 API
app.get('/api/database', async (req, res) => {
  try {
    const databaseId = process.env.VITE_NOTION_DATABASE_ID;

    if (!databaseId) {
      return res.status(400).json({ error: 'Database ID not found' });
    }

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const formattedData = {
      results: response.results.map((page) => ({
        id: page.id,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: page.properties,
      })),
      next_cursor: response.next_cursor,
      has_more: response.has_more,
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({ error: error.message });
  }
});

// 새 과제 생성 API
app.post('/api/tasks', async (req, res) => {
  try {
    const databaseId = process.env.VITE_NOTION_DATABASE_ID;
    const assignee = req.body.assignee || req.body['담당자'];
    const taskName = req.body.taskName || req.body['과제명'];
    const deadline = req.body.deadline || req.body['마감일'];
    const completed = req.body.completed || req.body['완료'] || false;
    const urgent = req.body.urgent || req.body['긴급'] || false;
    const submissionTo = req.body.submissionTo || req.body['제출처'] || '';
    const notes = req.body.notes || req.body['비고'] || '';

    console.log('Received request body:', req.body);
    console.log('Extracted fields:', { assignee, taskName, deadline, completed, urgent, submissionTo, notes });

    if (!databaseId) {
      return res.status(400).json({ error: 'Database ID not found' });
    }

    const properties = {
      담당자: {
        title: [
          {
            text: {
              content: assignee || ''
            }
          }
        ]
      },
      과제명: {
        rich_text: [
          {
            text: {
              content: taskName || ''
            }
          }
        ]
      },
      완료: {
        checkbox: completed
      },
      긴급: {
        checkbox: urgent
      },
      제출처: {
        rich_text: [
          {
            text: {
              content: submissionTo
            }
          }
        ]
      },
      비고: {
        rich_text: [
          {
            text: {
              content: notes
            }
          }
        ]
      }
    };

    // 마감일이 있는 경우에만 추가
    if (deadline) {
      properties.마감일 = {
        date: {
          start: deadline
        }
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과제 수정 API
app.patch('/api/tasks/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    console.log('PATCH request body:', req.body);
    const assignee = req.body.assignee !== undefined ? req.body.assignee : req.body['담당자'];
    const taskName = req.body.taskName !== undefined ? req.body.taskName : req.body['과제명'];
    const deadline = req.body.deadline !== undefined ? req.body.deadline : req.body['마감일'];
    const completed = req.body.completed !== undefined ? req.body.completed : req.body['완료'];
    const urgent = req.body.urgent !== undefined ? req.body.urgent : req.body['긴급'];
    const submissionTo = req.body.submissionTo !== undefined ? req.body.submissionTo : req.body['제출처'];
    const notes = req.body.notes !== undefined ? req.body.notes : req.body['비고'];
    console.log('Extracted fields:', { assignee, taskName, deadline, completed, urgent, submissionTo, notes });

    const properties = {};

    if (assignee !== undefined) {
      properties.담당자 = {
        title: [
          {
            text: {
              content: assignee
            }
          }
        ]
      };
    }

    if (taskName !== undefined) {
      properties.과제명 = {
        rich_text: [
          {
            text: {
              content: taskName
            }
          }
        ]
      };
    }

    if (completed !== undefined) {
      properties.완료 = {
        checkbox: completed
      };
    }

    if (urgent !== undefined) {
      properties.긴급 = {
        checkbox: urgent
      };
    }

    if (submissionTo !== undefined) {
      properties.제출처 = {
        rich_text: [
          {
            text: {
              content: submissionTo
            }
          }
        ]
      };
    }

    if (notes !== undefined) {
      properties.비고 = {
        rich_text: [
          {
            text: {
              content: notes
            }
          }
        ]
      };
    }

    if (deadline !== undefined) {
      if (deadline) {
        properties.마감일 = {
          date: {
            start: deadline
          }
        };
      } else {
        properties.마감일 = {
          date: null
        };
      }
    }

    const response = await notion.pages.update({
      page_id: pageId,
      properties: properties
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과제 삭제 API
app.delete('/api/tasks/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// 공지사항 조회 API
app.get('/api/notices', async (req, res) => {
  try {
    const noticesDatabaseId = process.env.VITE_NOTION_NOTICES_DATABASE_ID;

    if (!noticesDatabaseId) {
      return res.status(400).json({ error: 'Notices Database ID not found' });
    }

    const response = await notion.databases.query({
      database_id: noticesDatabaseId,
      sorts: [
        {
          property: '작성일',
          direction: 'descending'
        }
      ]
    });

    const formattedData = {
      results: response.results.map((page) => ({
        id: page.id,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: page.properties,
      })),
      next_cursor: response.next_cursor,
      has_more: response.has_more,
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: error.message });
  }
});

// 새 공지사항 생성 API
app.post('/api/notices', async (req, res) => {
  try {
    const noticesDatabaseId = process.env.VITE_NOTION_NOTICES_DATABASE_ID;
    const title = req.body.title || req.body['제목'];
    const content = req.body.content || req.body['내용'];
    const author = req.body.author || req.body['작성자'];
    const type = req.body.type || req.body['유형'] || 'general';

    console.log('Received notice request body:', req.body);
    console.log('Extracted fields:', { title, content, author, type });

    if (!noticesDatabaseId) {
      return res.status(400).json({ error: 'Notices Database ID not found' });
    }

    const properties = {
      제목: {
        title: [
          {
            text: {
              content: `[${author || '익명'}] ${title || ''}`
            }
          }
        ]
      },
      내용: {
        rich_text: [
          {
            text: {
              content: content || ''
            }
          }
        ]
      },
      선택: {
        select: {
          name: type === 'important' ? '중요' : '일반'
        }
      },
      작성일: {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      }
    };

    const response = await notion.pages.create({
      parent: { database_id: noticesDatabaseId },
      properties: properties
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ error: error.message });
  }
});

// 공지사항 수정 API
app.patch('/api/notices/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    console.log('PATCH notice request body:', req.body);
    const title = req.body.title !== undefined ? req.body.title : req.body['제목'];
    const content = req.body.content !== undefined ? req.body.content : req.body['내용'];
    const author = req.body.author !== undefined ? req.body.author : req.body['작성자'];
    const type = req.body.type !== undefined ? req.body.type : req.body['유형'];

    console.log('Extracted fields:', { title, content, author, type });

    const properties = {};

    if (title !== undefined) {
      properties.제목 = {
        title: [
          {
            text: {
              content: title
            }
          }
        ]
      };
    }

    if (content !== undefined) {
      properties.내용 = {
        rich_text: [
          {
            text: {
              content: content
            }
          }
        ]
      };
    }

    if (author !== undefined) {
      properties.작성자 = {
        rich_text: [
          {
            text: {
              content: author
            }
          }
        ]
      };
    }

    if (type !== undefined) {
      properties.선택 = {
        select: {
          name: type === 'important' ? '중요' : '일반'
        }
      };
    }

    const response = await notion.pages.update({
      page_id: pageId,
      properties: properties
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ error: error.message });
  }
});

// 공지사항 삭제 API
app.delete('/api/notices/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ error: error.message });
  }
});

// 댓글 조회 API
app.get('/api/comments/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const commentsDatabaseId = process.env.VITE_NOTION_COMMENTS_DATABASE_ID;

    if (!commentsDatabaseId) {
      return res.status(400).json({ error: 'Comments Database ID not found' });
    }

    const response = await notion.databases.query({
      database_id: commentsDatabaseId,
      filter: {
        property: '공지사항 ID',
        rich_text: {
          equals: noticeId
        }
      },
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'ascending'
        }
      ]
    });

    const formattedComments = response.results.map((comment) => ({
      id: comment.id,
      content: comment.properties.내용?.rich_text?.[0]?.plain_text || '',
      author: comment.properties.작성자?.rich_text?.[0]?.plain_text || '익명',
      createdAt: comment.created_time,
      noticeId: comment.properties['공지사항 ID']?.rich_text?.[0]?.plain_text || ''
    }));

    res.json({ success: true, comments: formattedComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// 댓글 생성 API
app.post('/api/comments', async (req, res) => {
  try {
    const commentsDatabaseId = process.env.VITE_NOTION_COMMENTS_DATABASE_ID;
    const { content, author, noticeId } = req.body;

    console.log('Received comment request body:', req.body);

    if (!commentsDatabaseId) {
      return res.status(400).json({ error: 'Comments Database ID not found' });
    }

    if (!content || !author || !noticeId) {
      return res.status(400).json({ error: 'Missing required fields: content, author, noticeId' });
    }

    const properties = {
      내용: {
        rich_text: [
          {
            text: {
              content: content
            }
          }
        ]
      },
      작성자: {
        rich_text: [
          {
            text: {
              content: author
            }
          }
        ]
      },
      '공지사항 ID': {
        rich_text: [
          {
            text: {
              content: noticeId
            }
          }
        ]
      }
    };

    const response = await notion.pages.create({
      parent: { database_id: commentsDatabaseId },
      properties: properties
    });

    const newComment = {
      id: response.id,
      content,
      author,
      createdAt: new Date().toISOString(),
      noticeId
    };

    res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// 댓글 삭제 API
app.delete('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const response = await notion.pages.update({
      page_id: commentId,
      archived: true
    });

    res.json({ success: true, comment: response });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// 사용자 등록 API
app.post('/api/users/register', async (req, res) => {
  try {
    const usersDatabaseId = process.env.VITE_NOTION_USERS_DATABASE_ID;
    const { googleId, name, email, picture } = req.body;

    console.log('User registration request:', { googleId, name, email });

    if (!usersDatabaseId) {
      return res.status(400).json({ error: 'Users Database ID not found' });
    }

    if (!googleId || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields: googleId, name, email' });
    }

    // 기존 사용자 확인
    const existingUserResponse = await notion.databases.query({
      database_id: usersDatabaseId,
      filter: {
        property: '구글ID',
        rich_text: {
          equals: googleId
        }
      }
    });

    if (existingUserResponse.results.length > 0) {
      const user = existingUserResponse.results[0];
      const formattedUser = {
        id: user.id,
        name: user.properties.이름?.title?.[0]?.plain_text || '',
        email: user.properties.이메일?.email || '',
        googleId: user.properties.구글ID?.rich_text?.[0]?.plain_text || '',
        role: user.properties.역할?.select?.name || '일반사용자',
        status: user.properties.승인상태?.select?.name || '대기중',
        picture: user.properties.프로필사진?.url || ''
      };

      return res.json({ success: true, user: formattedUser, isNewUser: false });
    }

    // 새 사용자 등록
    const properties = {
      이름: {
        title: [
          {
            text: {
              content: name
            }
          }
        ]
      },
      이메일: {
        email: email
      },
      구글ID: {
        rich_text: [
          {
            text: {
              content: googleId
            }
          }
        ]
      },
      역할: {
        select: {
          name: '일반사용자'
        }
      },
      승인상태: {
        select: {
          name: '대기중'
        }
      },
      가입일: {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      }
    };

    if (picture) {
      properties.프로필사진 = {
        url: picture
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: usersDatabaseId },
      properties: properties
    });

    const newUser = {
      id: response.id,
      name,
      email,
      googleId,
      role: '일반사용자',
      status: '대기중',
      picture: picture || ''
    };

    res.json({ success: true, user: newUser, isNewUser: true });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 사용자 목록 조회 API (관리자용)
app.get('/api/users', async (req, res) => {
  try {
    const usersDatabaseId = process.env.VITE_NOTION_USERS_DATABASE_ID;

    if (!usersDatabaseId) {
      return res.status(400).json({ error: 'Users Database ID not found' });
    }

    const response = await notion.databases.query({
      database_id: usersDatabaseId,
      sorts: [
        {
          property: '가입일',
          direction: 'descending'
        }
      ]
    });

    const formattedUsers = response.results.map((user) => ({
      id: user.id,
      name: user.properties.이름?.title?.[0]?.plain_text || '',
      email: user.properties.이메일?.email || '',
      googleId: user.properties.구글ID?.rich_text?.[0]?.plain_text || '',
      role: user.properties.역할?.select?.name || '일반사용자',
      status: user.properties.승인상태?.select?.name || '대기중',
      joinDate: user.properties.가입일?.date?.start || user.created_time.split('T')[0],
      picture: user.properties.프로필사진?.url || ''
    }));

    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// 사용자 승인/거부 API
app.patch('/api/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, role } = req.body;

    const properties = {};

    if (status) {
      properties.승인상태 = {
        select: {
          name: status
        }
      };
    }

    if (role) {
      properties.역할 = {
        select: {
          name: role
        }
      };
    }

    const response = await notion.pages.update({
      page_id: userId,
      properties: properties
    });

    res.json({ success: true, user: response });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});