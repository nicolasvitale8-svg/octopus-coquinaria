import re

file_path = "src/finance/pages/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I want to rebuild the structure after the activeDetail modal.
# We will find the start of the 3-column grid.
start_idx = content.find('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">')
end_idx = content.rfind('</div>\n    </div>\n  );\n};')

# Let's extract each piece using the comments as markers.
def extract_section(start_comment, end_comment=None):
    start = content.find(start_comment)
    if start == -1: return ""
    if end_comment:
        end = content.find(end_comment, start)
        return content[start:end]
    return ""

donut = extract_section('{/* Main Chart Section - Donut de Distribución */}', '{/* Budget Health Column */}')
# donut has an extra `</div>` at the end which closed the lg:col-span-2. We will handle that.
budget_health = extract_section('{/* Budget Health Column */}', '{/* Loans & Jars Row */}')
# budget_health has `</div>` at the end that closed the 3-column grid.
loans = extract_section('{/* Loans & Jars Row */}', '{/* Smart Insights Row */}')
insights = extract_section('{/* Smart Insights Row */}', '{/* Sidebar right side */}')
sidebar_rest = extract_section('{/* Sidebar right side */}', '</div>\n    </div>\n  );\n};')

# Clean up pieces
donut = donut.rsplit('</div>', 1)[0].strip() # remove the lg:col-span-2 closer
# we open it in the new layout manually.
donut = donut.replace('<div className="lg:col-span-2 space-y-8">', '').strip()

# budget health closed the main grid, remove that
budget_health = budget_health.rsplit('</div>', 1)[0].rsplit('</div>', 1)[0].strip()
budget_health = budget_health.replace('<div className="lg:col-span-1 space-y-6">', '').strip()

loans = loans.replace('<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">', '<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">').replace('{/* Loans & Jars Row */}', '{/* Loans & Jars Row */}').strip()

# In insights, it was `grid-cols-1 lg:grid-cols-3`, but now inside a 2-col span it should probably be 1 or 2.
insights = insights.replace('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">', '<div className="flex flex-col gap-6">').strip()

# Next, inside insights we had Spending Alerts, Cash Flow, Savings Rate. We can keep them stacked.

# The rest of the sidebar: it was opened with:
# {/* Sidebar right side */}
# <div className="lg:col-span-1 space-y-10">
sidebar_rest = sidebar_rest.replace('<div className="lg:col-span-1 space-y-10">', '').strip()
# remove the last closing div of the sidebar
if sidebar_rest.endswith('</div>'):
    sidebar_rest = sidebar_rest[:-6].strip()

# Assemble the new structure
new_structure = f"""
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {{/* LEFT COLUMN (2/3 width on desktop) */}}
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          {donut}
          {loans}
          {insights}
        </div>

        {{/* RIGHT SIDEBAR (1/3 width on desktop) */}}
        <div className="lg:col-span-1 space-y-8 flex flex-col">
          {budget_health}
          {sidebar_rest}
        </div>

      </div>
"""

new_content = content[:start_idx] + new_structure.strip() + '\n    </div>\n  );\n};\n'

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Reorganization complete!")
