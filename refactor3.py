import re

with open("src/finance/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Extract Budget Health Component
budget_start = text.find('        {/* Budget Health Column */}')
budget_end = text.find('      </div>\n\n      {/* Loans & Jars Row */}')

budget_health_code = text[budget_start:budget_end]

# 2. Extract the main layout parts
left_chart_start = text.find('      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\n        {/* Main Chart Section - Donut de Distribución */}')

# The end of the first grid
first_grid_end = budget_end + len('      </div>\n')

# 3. Replace the Loans & Jars Row to be inside lg:col-span-2
loans_start = text.find('      {/* Loans & Jars Row */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">')
text = text.replace(
    '      {/* Loans & Jars Row */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">',
    '      {/* Loans & Jars Row */}\n      <div className="lg:col-span-2">\n        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">'
)
# Close it (it ended before Smart Insights)
smart_start = text.find('      {/* Smart Insights Row */}')
text = text[:smart_start] + '        </div>\n' + text[smart_start:]

# 4. Replace Smart Insights Row to be inside lg:col-span-2
text = text.replace(
    '      {/* Smart Insights Row */}\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">',
    '      {/* Smart Insights Row */}\n      <div className="lg:col-span-2">\n        <div className="flex flex-col gap-6">'
)
# Close it (it ended before Sidebar right side)
sidebar_start = text.find('      {/* Sidebar right side */}')
text = text[:sidebar_start] + '        </div>\n' + text[sidebar_start:]

# 5. Bring Budget Health inside Sidebar
text = text.replace(
    '      {/* Sidebar right side */}\n      <div className="lg:col-span-1 space-y-10">',
    '      {/* Sidebar right side */}\n      <div className="lg:col-span-1 space-y-10">\n' + budget_health_code + '\n'
)

# 6. Delete Budget Health from the original position, and keep the main Grid wrapper OPEN
# The original code had:
#         {/* Budget Health Column */}
#         ...
#       </div>
#       {/* Loans & Jars Row */}
text = text.replace(
    budget_health_code + '      </div>\n\n      {/* Loans & Jars Row */}',
    '      {/* Loans & Jars Row */}'
)

# Because we removed that `      </div>\n` which closed the main grid,
# the main grid `<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">` is NOW OPEN all the way down!
# It will automatically wrap around Donut (col-span-2), Loans (col-span-2), Insights (col-span-2), AND Sidebar (col-span-1).
# BUT Wait! Sidebar must span the entire height of the right side, so it should be the SECOND element in the wrapper if we want it to float right.
# CSS grid doesn't care about order if we specify rows, but we didn't specify rows. 
# In a 3-column grid, if we have [col-span-2], [col-span-2], [col-span-2], [col-span-1], the col-span-1 will be placed automatically in the empty space of row 1, 2 or 3 IF there is space AND if dense packing is on?
# Actually it's better to use flex layout or a 2-column grid.
# The wrapping grid is `lg:grid-cols-3`.
# Element 1: `lg:col-span-2` -> Occupies (row 1, col 1,2)
# Element 2: `lg:col-span-2` -> Occupies (row 2, col 1,2)
# Element 3: `lg:col-span-2` -> Occupies (row 3, col 1,2)
# Element 4 (Sidebar): `lg:col-span-1` -> Occupies (row 1,2,3, col 3). BUT grid auto-placement only goes forward! 
# Element 4 will be placed at (row 4, col 1) unless we force it to `lg:col-start-3 lg:row-start-1 lg:row-span-3`.

# Let's force Sidebar right side to occupy the right column from the top!
text = text.replace(
    '      {/* Sidebar right side */}\n      <div className="lg:col-span-1 space-y-10">',
    '      {/* Sidebar right side */}\n      <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-4 space-y-8">'
)

with open("src/finance/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Grid layout fixed via injection")
