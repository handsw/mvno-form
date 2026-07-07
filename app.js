// ─────────────────────────────────────────────────────────────
//  아정당알뜰폰 가입신청서 비즈니스 로직 및 서명 모달 제어
// ─────────────────────────────────────────────────────────────

// 요금제 데이터 데이터베이스
const PLANS = {
  "life_4.5GB":    { data: "4.5GB",  call: "기본제공",  extra: "300분",  sms: "기본제공",  period: "평생",  fee: "9,900원" },  
  "life_7GB":      { data: "7GB",    call: "기본제공",  extra: "300분",  sms: "기본제공",  period: "평생",  fee: "16,900원" },
  "life_10GB":     { data: "10GB",   call: "기본제공",  extra: "300분",  sms: "기본제공",  period: "평생",  fee: "19,900원" },
  "life_15GB_100": { data: "15GB",  call: "100분",    extra: "100분",  sms: "100건",    period: "평생",  fee: "24,900원" },
  "life_15GB_300": { data: "15GB",  call: "300분",    extra: "300분",  sms: "300건",    period: "평생",  fee: "25,900원" },
  "life_71GB":     { data: "71GB(11GB+매일 2GB)", call: "기본제공", extra: "300분", sms: "기본제공", period: "평생", fee: "32,900원" },
  "life_150GB":    { data: "매일 5GB", call: "기본제공",  extra: "300분",  sms: "기본제공",  period: "평생",  fee: "39,900원" },
  "life_100GB":    { data: "100GB",   call: "기본제공",  extra: "300분",  sms: "기본제공",  period: "평생",  fee: "39,900원" }
};

// 서명 상태 데이터
let canvas = null;
let ctx = null;
let isDrawing = false;
let lastPosition = { x: 0, y: 0 };
let hasDrawed = false;

// ─────────────────────────────────────────────────────────────
//  화면 구성 (Multi-page)
//  index.html(망 선택) → LG_v2.html / KT_v1.html 로 페이지 이동합니다.
//  과거 단일 페이지(SPA) 라우팅 함수(showLGForm 등)는 페이지 분리로 제거되었으며,
//  '망 선택' 이동은 각 신청서 상단바의 location.href 로 처리합니다.
//  app.js / style.css 는 LG·KT 신청서가 공통으로 재사용합니다.
// ─────────────────────────────────────────────────────────────

// 페이지가 완전히 로드되면 동작 초기화
document.addEventListener('DOMContentLoaded', () => {
  initSignatureModal();
  autofillCurrentDate();
});

// ─────────────────────────────────────────────────────────────
//  요금제 정보 동적 기입 (fillPlan)
// ─────────────────────────────────────────────────────────────
function fillPlan() {
  const planKey = document.getElementById('planSelect').value;
  const p = PLANS[planKey];
  
  document.getElementById('p_data').textContent   = p ? p.data   : '-';
  document.getElementById('p_call').textContent   = p ? p.call   : '-';
  document.getElementById('p_extra').textContent  = p ? p.extra  : '-';
  document.getElementById('p_sms').textContent    = p ? p.sms    : '-';
  document.getElementById('p_period').textContent = p ? p.period : '-';
  document.getElementById('p_fee').textContent    = p ? p.fee    : '-';
  
  // 에러 해제
  document.getElementById('planSelect').classList.remove('select-error');
}

// ─────────────────────────────────────────────────────────────
//  납부방법 토글 (togglePay)
// ─────────────────────────────────────────────────────────────
function togglePay(value) {
  const isCard = value === '카드';
  
  document.getElementById('lbl_owner').textContent   = isCard ? '카드주명'      : '예금주명';
  document.getElementById('lbl_bank').textContent    = isCard ? '카드사'        : '은행';
  document.getElementById('lbl_account').textContent = isCard ? '카드번호'      : '계좌번호';
  document.getElementById('row_expiry').style.display = isCard ? '' : 'none';
  
  // 에러 리셋
  document.getElementById('inp_owner').classList.remove('field-error');
  document.getElementById('inp_bank').classList.remove('field-error');
  document.getElementById('inp_account').classList.remove('field-error');
  document.getElementById('inp_expiry').classList.remove('field-error');
  
  // 이전 잔여값 클리어
  if (!isCard) {
    document.getElementById('inp_expiry').value = '';
  }
}

// ─────────────────────────────────────────────────────────────
//  업무구분 토글 (toggleBiz)
// ─────────────────────────────────────────────────────────────
function toggleBiz(value) {
  const isNew = value === '신규';
  
  document.getElementById('blk_new').classList.toggle('cond-off', !isNew);
  document.getElementById('blk_mnp').classList.toggle('cond-off',  isNew);
  
  // 에러 리셋
  document.getElementById('inp_new_num').classList.remove('field-error');
  document.getElementById('inp_mnp_num').classList.remove('field-error');
  const chkRandom = document.getElementById('chk_random_num');
  if (chkRandom) {
    chkRandom.parentElement.classList.remove('check-error');
  }
  
  // 이전 잔여값 클리어
  if (isNew) {
    document.getElementById('inp_mnp_num').value = '';
    const carrierRadios = document.querySelectorAll('input[name="prev_carrier"]');
    carrierRadios.forEach(r => {
      r.checked = false;
      r.parentElement.classList.remove('check-error');
    });
    document.getElementById('mvnoNameWrap').style.display = 'none';
    document.querySelector('.mvno-name').value = '';
  } else {
    document.getElementById('inp_new_num').value = '';
    if (chkRandom) {
      chkRandom.checked = false;
    }
  }

  updateNewNumNotice();
}

// ─────────────────────────────────────────────────────────────
//  희망번호/랜덤번호 유의사항 업데이트 (updateNewNumNotice)
// ─────────────────────────────────────────────────────────────
function updateNewNumNotice() {
  const inpNewNum = document.getElementById('inp_new_num');
  const chkRandomNum = document.getElementById('chk_random_num');
  const notice = document.getElementById('new_num_notice');
  if (!inpNewNum || !chkRandomNum || !notice) return;

  const hasInput = inpNewNum.value.trim() !== '';
  const isChecked = chkRandomNum.checked;

  if (hasInput && isChecked) {
    notice.textContent = '※ 희망번호로 개통 가능한 번호가 없을 시, 임의번호로 개통됩니다.';
    notice.style.display = 'block';
  } else if (isChecked) {
    notice.textContent = '※ 체크 시, 임의번호로 개통됩니다.';
    notice.style.display = 'block';
  } else if (hasInput) {
    notice.textContent = '※ 희망번호로 개통 가능한 번호가 없을 시, 개통이 지연될 수 있습니다.';
    notice.style.display = 'block';
  } else {
    notice.style.display = 'none';
    notice.textContent = '';
  }
}

// ─────────────────────────────────────────────────────────────
//  청구서 수신 방법 토글 (toggleBill)
// ─────────────────────────────────────────────────────────────
function toggleBill(value) {
  const emailWrap = document.getElementById('billEmailWrap');
  const emailId = document.querySelector('.email-id');
  const emailDomain = document.querySelector('.email-domain');

  if (value === '이메일') {
    emailWrap.style.display = 'inline-flex';
  } else {
    emailWrap.style.display = 'none';
    if (emailId) {
      emailId.value = '';
      emailId.classList.remove('field-error');
    }
    if (emailDomain) {
      emailDomain.value = '';
      emailDomain.classList.remove('field-error');
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  번호이동 알뜰폰 사업자 입력창 토글 (toggleMvnoInput)
// ─────────────────────────────────────────────────────────────
function toggleMvnoInput(value) {
  const wrap = document.getElementById('mvnoNameWrap');
  const mvnoName = document.querySelector('.mvno-name');

  // 에러 표시 지우기
  document.querySelectorAll('input[name="prev_carrier"]').forEach(r => {
    r.parentElement.classList.remove('check-error');
  });

  if (value === '알뜰') {
    wrap.style.display = 'inline-flex';
  } else {
    wrap.style.display = 'none';
    if (mvnoName) {
      mvnoName.value = '';
      mvnoName.classList.remove('field-error');
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  날짜 자동 입력
// ─────────────────────────────────────────────────────────────
function autofillCurrentDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');

  document.querySelectorAll('.print-year').forEach(el => el.value = year);
  document.querySelectorAll('.print-month').forEach(el => el.value = month);
  document.querySelectorAll('.print-day').forEach(el => el.value = date);
}

// ─────────────────────────────────────────────────────────────
//  서명 모달 제어 (HTML5 Canvas Signature Pad)
// ─────────────────────────────────────────────────────────────
function initSignatureModal() {
  canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');
  const hint = document.getElementById('sig-hint');

  // 반응형 너비 매칭
  function setupCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  // 모달을 열었을 때 Canvas 크기 보정
  window.addEventListener('resize', setupCanvasSize);

  // 드로잉 좌표 획득 함수
  function getDrawPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // 마우스/터치 이벤트 등록
  function startDrawing(e) {
    isDrawing = true;
    lastPosition = getDrawPosition(e);
    hint.style.opacity = '0';
    hasDrawed = true;
    
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    const currentPos = getDrawPosition(e);
    
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    
    lastPosition = currentPos;
  }

  function stopDrawing() {
    isDrawing = false;
    ctx.closePath();
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 스크롤 방지
    startDrawing(e);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  });
  canvas.addEventListener('touchend', stopDrawing);

  // 서명 지우기
  document.getElementById('btn-sig-clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hint.style.opacity = '1';
    hasDrawed = false;
  });

  // 서명 모달 닫기
  document.getElementById('btn-sig-cancel').addEventListener('click', closeSignatureModal);

  // 서명 적용
  document.getElementById('btn-sig-apply').addEventListener('click', () => {
    if (!hasDrawed) {
      alert('서명을 작성해 주세요.');
      return;
    }
    
    const dataURL = canvas.toDataURL('image/png');
    
    // 두 곳의 서명 박스에 이미지 입력
    const signBoxes = document.querySelectorAll('.p-sign-box');
    signBoxes.forEach(box => {
      box.classList.add('signed');
      const img = box.querySelector('.signature-image');
      if (img) {
        img.src = dataURL;
        img.style.display = 'block';
      }
    });

    closeSignatureModal();
  });

  // 입력 이벤트 연동 (에러 해제용)
  const inputs = document.querySelectorAll('input[type="text"], select');
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.classList.remove('field-error', 'select-error');
    });
  });

  // 동의서 체크박스 변경 시 에러 해제
  const checks = document.querySelectorAll('input[type="checkbox"]');
  checks.forEach(chk => {
    chk.addEventListener('change', (e) => {
      if (e.target.checked) {
        e.target.parentElement.classList.remove('check-error');
      }
    });
  });

  // 희망번호 입력 및 랜덤번호 생성 체크 관련 이벤트 리스너
  const inpNewNum = document.getElementById('inp_new_num');
  const chkRandomNum = document.getElementById('chk_random_num');

  if (inpNewNum) {
    inpNewNum.addEventListener('input', () => {
      inpNewNum.classList.remove('field-error');
      if (inpNewNum.value.trim() !== '') {
        if (chkRandomNum) {
          chkRandomNum.parentElement.classList.remove('check-error');
        }
      }
      updateNewNumNotice();
    });
  }

  if (chkRandomNum) {
    chkRandomNum.addEventListener('change', () => {
      chkRandomNum.parentElement.classList.remove('check-error');
      if (chkRandomNum.checked) {
        if (inpNewNum) {
          inpNewNum.classList.remove('field-error');
        }
      }
      updateNewNumNotice();
    });
  }
}

function openSignatureModal() {
  const modal = document.getElementById('signatureModal');
  modal.classList.add('show');
  
  // Canvas 드로잉 옵션들 다시 매핑
  setTimeout(() => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('sig-hint').style.opacity = '1';
    hasDrawed = false;
  }, 100);
}

function closeSignatureModal() {
  document.getElementById('signatureModal').classList.remove('show');
}

// ─────────────────────────────────────────────────────────────
//  가입 신청서 필수값 검증 및 인쇄 (validateAndPrint)
// ─────────────────────────────────────────────────────────────
function clearErrors() {
  document.querySelectorAll('.field-error, .select-error, .check-error').forEach(el => {
    el.classList.remove('field-error', 'select-error', 'check-error');
  });
}

function validateAndPrint() {
  clearErrors();
  const errors = [];

  // 1. 기본 텍스트 및 셀렉트 검증
  const REQUIRED_FIELDS = [
    { id: 'planSelect',      label: '요금제 선택',    type: 'select' },
    { id: 'inp_name',        label: '가입자명',        type: 'text' },
    { id: 'inp_birth',       label: '생년월일',        type: 'text' },
    { id: 'inp_addr',        label: '가입자 주소',     type: 'text' },
    { id: 'inp_tel',         label: '연락처',          type: 'text' },
    { id: 'inp_owner',       label: '예금주명 / 카드주명', type: 'text' },
    { id: 'inp_bank',        label: '은행 / 카드사',   type: 'text' },
    { id: 'inp_account',     label: '계좌번호 / 카드번호', type: 'text' },
    { id: 'inp_sim_model',   label: 'SIM 모델명',      type: 'text' },
    { id: 'inp_sim_serial',  label: 'SIM 일련번호',    type: 'text' },
  ];

  // 카드 결제 선택 시 유효기간 추가 필수값 체크
  const payType = document.querySelector('input[name="pay_type"]:checked')?.value;
  const fieldsToCheck = [...REQUIRED_FIELDS];
  if (payType === '카드') {
    fieldsToCheck.push({ id: 'inp_expiry', label: '카드 유효기간', type: 'text' });
  }

  // 신규가입 vs 번호이동 필드 추가 분기 체크
  const bizType = document.querySelector('input[name="biz_type"]:checked')?.value;
  if (bizType === '번호이동') {
    fieldsToCheck.push({ id: 'inp_mnp_num', label: '이동할 번호', type: 'text' });
  } else {
    // 신규가입의 경우: 희망번호 입력 또는 랜덤번호 생성 선택 둘 중 하나는 해야 함
    const inpNewNum = document.getElementById('inp_new_num');
    const chkRandomNum = document.getElementById('chk_random_num');
    const hasInput = inpNewNum && inpNewNum.value.trim() !== '';
    const isChecked = chkRandomNum && chkRandomNum.checked;
    
    if (!hasInput && !isChecked) {
      if (inpNewNum) inpNewNum.classList.add('field-error');
      if (chkRandomNum) chkRandomNum.parentElement.classList.add('check-error');
      errors.push('희망 번호 입력 또는 랜덤번호 생성 선택');
    }
  }

  fieldsToCheck.forEach(({ id, label, type }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isEmpty = type === 'select' ? el.value === '' : el.value.trim() === '';
    if (isEmpty) {
      el.classList.add(type === 'select' ? 'select-error' : 'field-error');
      errors.push(label);
    }
  });

  // 청구 방법이 이메일일 경우 이메일 상세 정보 필수 체크
  const billMethod = document.querySelector('input[name="bill_method"]:checked')?.value;
  if (billMethod === '이메일') {
    const emailId  = document.querySelector('.email-id');
    const emailDom = document.querySelector('.email-domain');
    if (emailId && emailId.value.trim() === '') {
      emailId.classList.add('field-error');
      errors.push('이메일 아이디');
    }
    if (emailDom && emailDom.value.trim() === '') {
      emailDom.classList.add('field-error');
      errors.push('이메일 도메인');
    }
  }

  // 번호이동 시 변경 전 사업자 체크 필수 검증
  if (bizType === '번호이동') {
    const carrierChecked = document.querySelector('input[name="prev_carrier"]:checked');
    if (!carrierChecked) {
      document.querySelectorAll('input[name="prev_carrier"]').forEach(r => {
        r.parentElement.classList.add('check-error');
      });
      errors.push('변경 전 사업자 선택');
    } else if (carrierChecked.value === '알뜰') {
      const mvnoName = document.querySelector('.mvno-name');
      if (mvnoName && mvnoName.value.trim() === '') {
        mvnoName.classList.add('field-error');
        errors.push('이전 알뜰폰 사업자명');
      }
    }
  }

  // 2. 필수 체크 항목 검증 (1번 ~ 8번 동의서)
  for (let i = 1; i <= 8; i++) {
    const chk = document.getElementById('chk_consent' + i);
    if (chk && !chk.checked) {
      chk.parentElement.classList.add('check-error');
      errors.push(`동의서 ${i}번 필수 약관 동의`);
    }
  }

  // 3. 서명 여부 검증
  const signImg = document.querySelector('.signature-image');
  if (!signImg || !signImg.src || signImg.style.display === 'none') {
    errors.push('신청인 서명');
    
    // 서명 상자 영역 에러 표시
    document.querySelectorAll('.p-sign-box').forEach(box => {
      box.style.borderColor = 'var(--accent)';
    });
  }

  // 에러 리스트 팝업 띄우기
  if (errors.length > 0) {
    const list = document.getElementById('errorList');
    list.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
    document.getElementById('validModal').classList.add('show');
    return;
  }

  // 에러가 없으면 인쇄 출력 다이얼로그 호출
  window.print();
}

function closeModal() {
  document.getElementById('validModal').classList.remove('show');
  
  // 첫 번째 에러가 발생한 필드로 자동 포커스 및 스크롤 이동
  const firstError = document.querySelector('.field-error, .select-error, .check-error');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      firstError.focus();
    }, 400);
  }
  
  // 서명 박스 테두리 에러 흔적 리셋
  document.querySelectorAll('.p-sign-box').forEach(box => {
    box.style.borderColor = '';
  });
}
