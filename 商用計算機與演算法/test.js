    // 初始餐廳列表
    let restaurantList = [
      { name: '燒肉丼飯', category: 'school', favorite: false, note: '' },
      { name: '鹽酥雞王', category: 'home', favorite: true, note: '雞皮很好吃' },
    ];

    // 自定義地區列表
    let customDistricts = [];

    // DOM元素
    const restaurantListContainer = document.getElementById('restaurantList');
    const locationFilter = document.getElementById('locationFilter');

    // 初始化頁面 - 從本地存儲中加載數據
    window.onload = function() {
      // 加載保存的數據
      const savedRestaurants = localStorage.getItem('restaurantList');
      const savedDistricts = localStorage.getItem('customDistricts');
      
      if (savedRestaurants) {
        restaurantList = JSON.parse(savedRestaurants);
      }
      
      if (savedDistricts) {
        customDistricts = JSON.parse(savedDistricts);
        updateDistrictDropdown();
        renderCustomDistrictButtons();
      }
      
      renderRestaurants();
    };

    // 渲染餐廳列表
    function renderRestaurants() {
      const filter = locationFilter.value;
      restaurantListContainer.innerHTML = '';
      
      restaurantList
        .filter(r => filter === 'all' || r.category === filter)
        .forEach((r, i) => {
          const div = document.createElement('div');
          div.className = 'restaurant-card';
          
          const star = r.favorite ? '★' : '☆';
          const noteHTML = r.note ? `<div class="restaurant-note">${r.note}</div>` : '';
          
          // 根據類別獲取顯示名稱
          let categoryName = r.category === 'school' ? '學校附近' : 
                            r.category === 'home' ? '住家附近' : r.category;
                            
          // 對於自定義地區，查詢並取得正確的名稱
          const customDistrict = customDistricts.find(d => d.id === r.category);
          if (customDistrict) {
            categoryName = customDistrict.name;
          }
          
          div.innerHTML = `
            <div class="restaurant-info">
              <span class="restaurant-name">${r.name}</span>
              <span class="restaurant-tag">${categoryName}</span>
              ${noteHTML}
            </div>
            <div class="restaurant-actions">
              <button onclick="toggleFavorite(${i})">${star}</button>
              <button onclick="deleteRestaurant(${i})">🗑️</button>
            </div>
          `;
          restaurantListContainer.appendChild(div);
        });
        
      // 保存數據到本地存儲
      saveToLocalStorage();
    }

    // 更新地區下拉選單
    function updateDistrictDropdown() {
      // 先清除自定義選項（保留內置的選項）
      const options = Array.from(locationFilter.options);
      for (let i = options.length - 1; i >= 0; i--) {
        if (options[i].value !== 'all' && options[i].value !== 'school' && options[i].value !== 'home') {
          locationFilter.removeChild(options[i]);
        }
      }
      
      // 更新新增餐廳表單中的地區下拉選單
      const categoryInput = document.getElementById('categoryInput');
      const categoryOptions = Array.from(categoryInput.options);
      for (let i = categoryOptions.length - 1; i >= 0; i--) {
        if (categoryOptions[i].value !== 'school' && categoryOptions[i].value !== 'home') {
          categoryInput.removeChild(categoryOptions[i]);
        }
      }
      
      // 添加自定義地區
      customDistricts.forEach(district => {
        // 添加到篩選器
        const filterOption = document.createElement('option');
        filterOption.value = district.id;
        filterOption.textContent = district.name;
        locationFilter.appendChild(filterOption);
        
        // 添加到新增餐廳表單
        const categoryOption = document.createElement('option');
        categoryOption.value = district.id;
        categoryOption.textContent = district.name;
        categoryInput.appendChild(categoryOption);
      });
    }

    // 渲染自定義地區按鈕
    function renderCustomDistrictButtons() {
      // 確保有容器元素
      let customDistrictsContainer = document.getElementById('customDistricts');
      if (!customDistrictsContainer) {
        customDistrictsContainer = document.createElement('div');
        customDistrictsContainer.id = 'customDistricts';
        customDistrictsContainer.className = 'districts-container';
        document.querySelector('.filter-group').after(customDistrictsContainer);
      } else {
        customDistrictsContainer.innerHTML = '';
      }
      
      // 為每個自定義地區創建按鈕
      customDistricts.forEach(district => {
        const button = document.createElement('button');
        button.className = 'district-btn';
        button.style.backgroundColor = district.color;
        button.style.color = getContrastColor(district.color); // 根據背景色自動設置文字顏色
        button.innerHTML = `${district.icon} ${district.name}`;
        
        // 點擊按鈕切換到該地區
        button.onclick = () => {
          locationFilter.value = district.id;
          renderRestaurants();
        };
        
        // 添加刪除功能
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-district';
        deleteBtn.style.marginLeft = '8px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.onclick = (e) => {
          e.stopPropagation(); // 防止觸發按鈕的點擊事件
          deleteDistrict(district.id);
        };
        
        button.appendChild(deleteBtn);
        customDistrictsContainer.appendChild(button);
      });
    }

    // 打開新增地區對話框
    function openAddDistrict() {
      // 創建一個模態框而不是使用prompt
      const modal = document.getElementById('addDistrictModal');
      if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('districtNameInput').focus();
      } else {
        // 如果HTML中沒有定義模態框，則使用prompt
        const district = prompt('請輸入新的地區名稱：');
        if (district && district.trim()) {
          addDistrictWithName(district.trim());
        }
      }
    }

    // 關閉新增地區對話框
    function closeAddDistrict() {
      const modal = document.getElementById('addDistrictModal');
      if (modal) {
        modal.classList.add('hidden');
        document.getElementById('districtNameInput').value = '';
      }
    }

    // 新增地區（從模態框）
    function addDistrict() {
      const districtNameInput = document.getElementById('districtNameInput');
      const district = districtNameInput.value.trim();
      
      if (district) {
        addDistrictWithName(district);
        closeAddDistrict();
      }
    }

    // 新增地區的共用邏輯
    function addDistrictWithName(districtName) {
      // 生成唯一ID
      const districtId = 'district_' + Date.now();
      
      // 生成隨機顏色
      const randomColor = getRandomColor();
      
      // 隨機選一個圖示
      const icons = ['🏙️', '🌆', '🏬', '🏢', '🏣', '🏪', '🏫', '🏯', '🏰', '🌃', '🌉', '🏘️', '🏚️', '🏕️', '🌄', '🌅', '🍽️', '🍴', '🥢', '🍜', '🍲', '🥘'];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      
      // 創建新地區對象
      const newDistrict = {
        id: districtId,
        name: districtName,
        color: randomColor,
        icon: randomIcon
      };
      
      // 添加到自定義地區列表
      customDistricts.push(newDistrict);
      
      // 更新UI
      updateDistrictDropdown();
      renderCustomDistrictButtons();
      
      // 切換到新地區
      locationFilter.value = districtId;
      renderRestaurants();
      
      // 保存到本地存儲
      saveToLocalStorage();
    }

    // 刪除地區
    function deleteDistrict(districtId) {
      if (confirm('確定要刪除這個地區嗎？相關的餐廳將保留但會顯示在「全部」分類中。')) {
        // 找出要刪除的地區索引
        const index = customDistricts.findIndex(d => d.id === districtId);
        if (index !== -1) {
          customDistricts.splice(index, 1);
          
          // 更新UI
          updateDistrictDropdown();
          renderCustomDistrictButtons();
          
          // 如果當前選中的是被刪除的地區，則切換到「全部」
          if (locationFilter.value === districtId) {
            locationFilter.value = 'all';
          }
          
          renderRestaurants();
          
          // 保存到本地存儲
          saveToLocalStorage();
        }
      }
    }

    // 生成隨機顏色
    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    // 根據背景顏色計算文字顏色（黑或白）
    function getContrastColor(hexColor) {
      // 將十六進制顏色轉換為RGB
      const r = parseInt(hexColor.substr(1, 2), 16);
      const g = parseInt(hexColor.substr(3, 2), 16);
      const b = parseInt(hexColor.substr(5, 2), 16);
      
      // 計算亮度 (基於人眼對RGB顏色敏感度不同的加權公式)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // 如果亮度高，使用黑色文字；否則使用白色
      return brightness > 128 ? '#000000' : '#FFFFFF';
    }

    // 打開新增餐廳表單
    function openAddForm() {
      document.getElementById('addFormModal').classList.remove('hidden');
      document.getElementById('nameInput').focus();
    }

    // 關閉新增餐廳表單
    function closeAddForm() {
      document.getElementById('addFormModal').classList.add('hidden');
      document.getElementById('nameInput').value = '';
      document.getElementById('noteInput').value = '';
    }

    // 新增餐廳
    function addRestaurant() {
      const name = document.getElementById('nameInput').value;
      const category = document.getElementById('categoryInput').value;
      const note = document.getElementById('noteInput').value;
      
      if (name.trim()) {
        restaurantList.push({ name, category, favorite: false, note });
        renderRestaurants();
        closeAddForm();
      }
    }

    // 切換收藏狀態
    function toggleFavorite(index) {
      restaurantList[index].favorite = !restaurantList[index].favorite;
      renderRestaurants();
    }

    // 刪除餐廳
    function deleteRestaurant(index) {
      if (confirm(`確定要刪除「${restaurantList[index].name}」嗎？`)) {
        restaurantList.splice(index, 1);
        renderRestaurants();
      }
    }

    // 隨機推薦餐廳
    function recommendRandom() {
      const filtered = restaurantList.filter(r => {
        const filter = locationFilter.value;
        return filter === 'all' || r.category === filter;
      });
      
      if (filtered.length > 0) {
        const pick = filtered[Math.floor(Math.random() * filtered.length)];
        alert(`🎉 推薦你吃：「${pick.name}」${pick.note ? `\n備註：${pick.note}` : ''}`);
      } else {
        alert('目前沒有符合條件的餐廳！');
      }
    }

    // 從收藏中隨機推薦
    function recommendFavorite() {
      const filtered = restaurantList.filter(r => r.favorite);
      
      if (filtered.length > 0) {
        const pick = filtered[Math.floor(Math.random() * filtered.length)];
        alert(`⭐ 推薦收藏：「${pick.name}」${pick.note ? `\n備註：${pick.note}` : ''}`);
      } else {
        alert('你還沒有收藏任何餐廳喔！');
      }
    }

    // 監聽地區篩選變化
    locationFilter.addEventListener('change', renderRestaurants);

    // 保存數據到本地存儲
    function saveToLocalStorage() {
      localStorage.setItem('restaurantList', JSON.stringify(restaurantList));
      localStorage.setItem('customDistricts', JSON.stringify(customDistricts));
    }

    // 初始渲染
    renderRestaurants();
