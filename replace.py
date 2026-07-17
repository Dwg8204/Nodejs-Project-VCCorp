import os
import glob

def replace_in_file(path, target, replacement):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if target in content:
        content = content.replace(target, replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

replace_in_file('docs/profile.html', '<button class="lang-btn" onclick="toggleLangMenu()"><iconify-icon icon="solar:global-bold-duotone"></iconify-icon> <span class="lang-current-label">Tiếng Việt</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>', '<button class="lang-btn" onclick="toggleLangMenu()"><span class="lang-current-label">Tiếng Việt</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>')

replace_in_file('docs/post-form.html', '<button class="lang-btn" onclick="toggleLangMenu()">\n          <iconify-icon icon="solar:global-bold-duotone"></iconify-icon>\n          <span class="lang-current-label">English</span>', '<button class="lang-btn" onclick="toggleLangMenu()">\n          <span class="lang-current-label">English</span>')

replace_in_file('docs/owner-posts.html', '<button class="lang-btn" onclick="toggleLangMenu()">\n          <iconify-icon icon="solar:global-bold-duotone"></iconify-icon>\n          <span class="lang-current-label">English</span>', '<button class="lang-btn" onclick="toggleLangMenu()">\n          <span class="lang-current-label">English</span>')

replace_in_file('docs/index.html', '<button class="lang-btn" onclick="toggleLangMenu()">\n          <iconify-icon icon="solar:global-bold-duotone"></iconify-icon>\n          <span class="lang-current-label">English</span>', '<button class="lang-btn" onclick="toggleLangMenu()">\n          <span class="lang-current-label">English</span>')

replace_in_file('docs/index.html', '<button class="lang-btn" onclick="toggleLangMenu()">\n              <iconify-icon icon="solar:global-bold-duotone"></iconify-icon>\n              <span class="lang-current-label">English</span>', '<button class="lang-btn" onclick="toggleLangMenu()">\n              <span class="lang-current-label">English</span>')

replace_in_file('docs/admin/index.html', '<button class="lang-btn" onclick="toggleLangMenu()"><iconify-icon icon="solar:global-bold-duotone"></iconify-icon> <span class="lang-current-label">English</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>', '<button class="lang-btn" onclick="toggleLangMenu()"><span class="lang-current-label">English</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>')

replace_in_file('docs/admin/users.html', '<button class="lang-btn" onclick="toggleLangMenu()"><iconify-icon icon="solar:global-bold-duotone"></iconify-icon> <span class="lang-current-label">English</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>', '<button class="lang-btn" onclick="toggleLangMenu()"><span class="lang-current-label">English</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>')

replace_in_file('docs/admin/categories.html', '<button class="lang-btn" onclick="toggleLangMenu()"><iconify-icon icon="solar:global-bold-duotone"></iconify-icon> <span class="lang-current-label">English</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>', '<button class="lang-btn" onclick="toggleLangMenu()"><span class="lang-current-label">English</span> <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon></button>')

replace_in_file('docs/admin/languages.html', '<button class="lang-btn" onclick="toggleLangMenu()"><iconify-icon\n            icon="solar:global-bold-duotone"></iconify-icon> <span class="lang-current-label">English</span>', '<button class="lang-btn" onclick="toggleLangMenu()"> <span class="lang-current-label">English</span>')

for path in glob.glob('docs/**/*.html', recursive=True) + ['docs/shared.js']:
    path = path.replace('\\\\', '/')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace('solar:user-circle-bold-duotone', 'solar:user-bold-duotone')
    new_content = new_content.replace('solar:document-text-bold-duotone', 'solar:notes-bold-duotone')
    new_content = new_content.replace('solar:chart-2-bold-duotone', 'solar:widget-bold-duotone')
    new_content = new_content.replace('solar:folder-bold-duotone', 'solar:tag-bold-duotone')
    if content != new_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)

print("Done")
